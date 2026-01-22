import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { isWorkingHour } from "@/lib/timezone";
import { format } from "date-fns";
import { fromZonedTime, toZonedTime, getTimezoneOffset } from "date-fns-tz"; // TAMBAH: getTimezoneOffset

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date"); // Format: YYYY-MM-DD
  const participantId = searchParams.get("participantId");

  if (!dateStr) return NextResponse.json({ error: "Date required" }, { status: 400 });

  const creator = await db.user.findUnique({ where: { id: session.sub as string } });
  if (!creator) return NextResponse.json({ error: "User not found" }, { status: 404 });
  
  let participant = null;
  let context = null;

  if (participantId) {
    participant = await db.user.findUnique({ where: { id: participantId } });
    
    if (participant) {
      // 1. Konversi Jam Kerja Partisipan
      const pStartString = `${dateStr}T08:00:00`; 
      const pEndString = `${dateStr}T17:00:00`;

      const pStartUTC = fromZonedTime(pStartString, participant.preferred_timezone);
      const pEndUTC = fromZonedTime(pEndString, participant.preferred_timezone);

      const startInCreatorTime = toZonedTime(pStartUTC, creator.preferred_timezone);
      const endInCreatorTime = toZonedTime(pEndUTC, creator.preferred_timezone);

      // 2. LOGIC BARU: Hitung Selisih Jam (Offset Difference)
      const now = new Date();
      // getTimezoneOffset balikin milliseconds
      const offsetCreator = getTimezoneOffset(creator.preferred_timezone, now);
      const offsetParticipant = getTimezoneOffset(participant.preferred_timezone, now);
      
      const diffInMs = offsetParticipant - offsetCreator;
      const diffInHours = diffInMs / (1000 * 60 * 60);

      // Format text (Contoh: "+7 hrs" atau "-3 hrs")
      let diffText = "Same time";
      if (diffInHours > 0) {
        diffText = `+${diffInHours} hrs`; // Dia lebih cepat (Ahead)
      } else if (diffInHours < 0) {
        diffText = `${diffInHours} hrs`; // Dia lebih lambat (Behind)
      }

      context = {
        name: participant.name,
        timezone: participant.preferred_timezone,
        workingHoursInLocal: `${format(startInCreatorTime, "HH:mm")} - ${format(endInCreatorTime, "HH:mm")}`,
        timeDifference: diffText // Kirim data baru ini
      };
    }
  }

  const slots = [];
  
  // Cek 24 jam
  for (let i = 0; i < 24; i++) {
    const timeString = `${dateStr}T${i.toString().padStart(2, '0')}:00:00`;
    
    const checkTimeUTC = fromZonedTime(timeString, creator.preferred_timezone);
    const isCreatorAvailable = isWorkingHour(checkTimeUTC, creator.preferred_timezone);
    
    let isParticipantAvailable = true;
    let participantTimeStr = "";

    if (participant) {
      isParticipantAvailable = isWorkingHour(checkTimeUTC, participant.preferred_timezone);
      const localTimeParticipant = toZonedTime(checkTimeUTC, participant.preferred_timezone);
      participantTimeStr = format(localTimeParticipant, "HH:mm");
    }

    if (isCreatorAvailable && isParticipantAvailable) {
      const localTimeCreator = toZonedTime(checkTimeUTC, creator.preferred_timezone);
      slots.push({
        creator: format(localTimeCreator, "HH:mm"),
        participant: participantTimeStr,
      });
    }
  }

  return NextResponse.json({ slots, context });
}
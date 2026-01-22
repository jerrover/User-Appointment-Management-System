import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { isWorkingHour } from "@/lib/timezone";
import { format } from "date-fns";
import { fromZonedTime, toZonedTime, getTimezoneOffset } from "date-fns-tz";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date"); 
  const participantIdsStr = searchParams.get("participantIds"); 
  const participantIds = participantIdsStr ? participantIdsStr.split(",").filter(Boolean) : [];

  if (!dateStr) return NextResponse.json({ error: "Date required" }, { status: 400 });

  const creator = await db.user.findUnique({ where: { id: session.sub as string } });
  if (!creator) return NextResponse.json({ error: "User not found" }, { status: 404 });
  
  const participants = await db.user.findMany({
    where: { id: { in: participantIds } }
  });

  const contexts = participants.map(p => {
      const pStartUTC = fromZonedTime(`${dateStr}T08:00:00`, p.preferred_timezone);
      const pEndUTC = fromZonedTime(`${dateStr}T17:00:00`, p.preferred_timezone);
      const startInCreatorTime = toZonedTime(pStartUTC, creator.preferred_timezone);
      const endInCreatorTime = toZonedTime(pEndUTC, creator.preferred_timezone);

      const now = new Date();
      const offsetCreator = getTimezoneOffset(creator.preferred_timezone, now);
      const offsetParticipant = getTimezoneOffset(p.preferred_timezone, now);
      const diffInHours = (offsetParticipant - offsetCreator) / (1000 * 60 * 60);

      let diffText = "Same time";
      if (diffInHours > 0) diffText = `+${diffInHours} hrs`;
      else if (diffInHours < 0) diffText = `${diffInHours} hrs`;

      return {
        id: p.id,
        name: p.name,
        timezone: p.preferred_timezone,
        workingHoursInLocal: `${format(startInCreatorTime, "HH:mm")} - ${format(endInCreatorTime, "HH:mm")}`,
        timeDifference: diffText
      };
  });

  const slots = [];
  
  for (let i = 0; i < 24; i++) {
    const timeString = `${dateStr}T${i.toString().padStart(2, '0')}:00:00`;
    const checkTimeUTC = fromZonedTime(timeString, creator.preferred_timezone);
    
    const isCreatorAvailable = isWorkingHour(checkTimeUTC, creator.preferred_timezone);
    
    let areAllParticipantsAvailable = true;
    
    for (const p of participants) {
        if (!isWorkingHour(checkTimeUTC, p.preferred_timezone)) {
            areAllParticipantsAvailable = false;
            break; 
        }
    }

    if (isCreatorAvailable && areAllParticipantsAvailable) {
      const localTimeCreator = toZonedTime(checkTimeUTC, creator.preferred_timezone);
      slots.push({
        creator: format(localTimeCreator, "HH:mm"),
      });
    }
  }

  return NextResponse.json({ slots, contexts });
}
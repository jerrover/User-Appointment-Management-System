import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isWorkingHour, isWorkingHourEnd, toUTC } from "@/lib/timezone"; 
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, start, end, participantId } = body;

  const currentUser = await db.user.findUnique({ where: { id: session.sub as string } });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const startDateObj = new Date(start);
  const endDateObj = new Date(end);
  
  if (startDateObj >= endDateObj) {
    return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
  }

  if (!isWorkingHour(startDateObj, currentUser.preferred_timezone) || !isWorkingHourEnd(endDateObj, currentUser.preferred_timezone)) {
     return NextResponse.json({ error: "Time is outside YOUR working hours (08:00 - 17:00)." }, { status: 400 });
  }

  if (participantId) {
    const participant = await db.user.findUnique({ where: { id: participantId } });
    
    if (participant) {
        const isStartValid = isWorkingHour(startDateObj, participant.preferred_timezone);
        const isEndValid = isWorkingHourEnd(endDateObj, participant.preferred_timezone);

        if (!isStartValid || !isEndValid) {
            return NextResponse.json({ 
                error: `Time is outside ${participant.name}'s working hours (${participant.preferred_timezone}).` 
            }, { status: 400 });
        }
    }
  }

  await db.appointment.create({
    data: {
      title,
      start: startDateObj,
      end: endDateObj,
      creatorId: currentUser.id,
      participants: {
        connect: participantId ? [{ id: participantId }] : [],
      },
    },
  });

  return NextResponse.json({ success: true });
}
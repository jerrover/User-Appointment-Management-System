import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> } 
) {
  const params = await props.params; 

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appointment = await db.appointment.findUnique({
    where: { id: params.id },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  if (appointment.creatorId !== session.sub) {
    return NextResponse.json({ error: "You can only cancel appointments you created." }, { status: 403 });
  }

  await db.appointment.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
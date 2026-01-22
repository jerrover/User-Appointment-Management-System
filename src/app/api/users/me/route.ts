import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.sub as string },
    select: { id: true, name: true, username: true, preferred_timezone: true }
  });

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { timezone } = body;

  if (!timezone) return NextResponse.json({ error: "Timezone required" }, { status: 400 });

  const updatedUser = await db.user.update({
    where: { id: session.sub as string },
    data: { preferred_timezone: timezone },
  });

  return NextResponse.json(updatedUser);
}
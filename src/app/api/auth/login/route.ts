import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    let user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          username,
          name: username, 
          preferred_timezone: "Asia/Jakarta", // Default timezone
        },
      });
    }

    // 2. Create session
    await createSession(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
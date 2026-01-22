import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import UserNav from "../user-nav";

export default async function Navbar() {
  const session = await getSession();
  
  // Logic: Kalau gak ada session, jangan render navbar sama sekali (biar Login page bersih)
  if (!session) return null;

  // Fetch data user terbaru langsung dari DB (Server Side Fetching = Cepat & Aman)
  const user = await db.user.findUnique({
    where: { id: session.sub as string },
  });

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-white/80 backdrop-blur-md px-6 h-16 flex items-center justify-between shadow-sm">
      {/* Logo Area */}
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 p-2 rounded-lg">
          <CalendarCheck className="w-5 h-5 text-primary" />
        </div>
        <Link href="/" className="font-bold text-lg tracking-tight hover:opacity-80 transition">
          ST - UserAppointment<span className="text-primary">App</span>
        </Link>
      </div>

      {/* User Interaction Area (Client Component) */}
      <UserNav user={user} />
    </nav>
  );
}
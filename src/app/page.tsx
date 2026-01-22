import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus } from "lucide-react";
import AppointmentCard from "@/components/appointment-card"; 

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.sub as string } });
  if (!user) redirect("/login");

  const rawAppointments = await db.appointment.findMany({
    where: {
      OR: [{ creatorId: user.id }, { participants: { some: { id: user.id } } }],
    },
    include: { creator: true, participants: true },
    orderBy: { start: "asc" },
  });

  const appointments = rawAppointments.map(apt => ({
    ...apt,
    start: apt.start.toISOString(),
    end: apt.end.toISOString(),
    creator: {
        ...apt.creator,
    },
    participants: apt.participants.map(p => ({
        ...p,
    }))
  }));

  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.end) >= now);
  const past = appointments.filter(a => new Date(a.end) < now);

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user.name}. Here is your schedule.
          </p>
        </div>
        <Link href="/new">
          <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
            <Plus className="w-4 h-4 mr-2" /> New Appointment
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-4">
            {upcoming.length === 0 ? <EmptyState /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcoming.map(apt => (
                        <AppointmentCard key={apt.id} appointment={apt} user={user} />
                    ))}
                </div>
            )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
            {past.length === 0 ? <EmptyState /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {past.map(apt => (
                        <AppointmentCard key={apt.id} appointment={apt} user={user} isPast />
                    ))}
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState() {
    return (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50/50">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No appointments found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2 text-sm">
                You don't have any appointments in this list. Create a new one to get started.
            </p>
        </div>
    )
}
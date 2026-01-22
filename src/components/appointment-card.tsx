"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useRouter } from "next/navigation";
import { 
  Card, CardContent, CardFooter, CardHeader 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Clock, Users, ArrowRight, Trash2, Calendar, User } from "lucide-react";
import { toast } from "sonner";

interface AppointmentCardProps {
  appointment: any; 
  user: any;
  isPast?: boolean;
}

export default function AppointmentCard({ appointment, user, isPast = false }: AppointmentCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const startLocal = toZonedTime(new Date(appointment.start), user.preferred_timezone);
  const endLocal = toZonedTime(new Date(appointment.end), user.preferred_timezone);
  const isCreator = appointment.creatorId === user.id;

  const handleDelete = async () => {
   
    setLoading(true);

    const res = await fetch(`/api/appointments/${appointment.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Appointment cancelled");
      setOpen(false); // Tutup Dialog Details
      router.refresh(); 
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to delete");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Card className={`group hover:shadow-md transition-all duration-300 border-l-4 ${isCreator ? 'border-l-primary' : 'border-l-purple-500'} ${isPast ? 'opacity-70 bg-gray-50' : 'bg-white'}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg leading-none group-hover:text-primary transition-colors line-clamp-1">
                {appointment.title}
              </h3>
              <Badge variant={isCreator ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-5">
                {isCreator ? "Host" : "Guest"}
              </Badge>
            </div>
            <div className="text-right shrink-0">
              <div className="flex flex-col items-end text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                <span className="text-xs text-gray-500 uppercase font-bold">{format(startLocal, "MMM")}</span>
                <span className="text-lg leading-none">{format(startLocal, "dd")}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2.5 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span>
                {format(startLocal, "HH:mm")} - {format(endLocal, "HH:mm")}
              </span>
            </div>
            {appointment.participants.length > 0 && (
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <p className="line-clamp-1">
                  {appointment.participants.map((p: any) => p.name).join(", ")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
        
        {!isPast && (
          <CardFooter className="pt-0 pb-4">
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 hover:text-primary group-hover:bg-primary/5 cursor-pointer">
                View Details <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </DialogTrigger>
          </CardFooter>
        )}
      </Card>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{appointment.title}</DialogTitle>
          <DialogDescription>
            Created by <span className="font-semibold text-primary">{isCreator ? "You" : appointment.creator.name}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">{format(startLocal, "EEEE, dd MMMM yyyy")}</span>
              <span className="text-xs text-gray-500">{format(startLocal, "HH:mm")} - {format(endLocal, "HH:mm")} ({user.preferred_timezone})</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4" /> Participants ({appointment.participants.length + 1})
            </h4>
            <ul className="grid gap-2 text-sm">
               <li className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">
                    {appointment.creator.name.charAt(0)}
                  </div>
                  <span>{appointment.creator.name} <span className="text-xs text-muted-foreground">(Host)</span></span>
              </li>
              {appointment.participants.map((p: any) => (
                <li key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                    {p.name.charAt(0)}
                  </div>
                  <span>{p.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
            {isCreator && !isPast ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={loading}>
                        {loading ? "Cancelling..." : <><Trash2 className="w-4 h-4 mr-2" /> Cancel Appointment</>}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently remove your appointment.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            ) : (
                <div /> 
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
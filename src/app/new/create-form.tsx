"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Loader2, Sparkles, CalendarIcon, Clock, XCircle, Globe, Info } from "lucide-react"; 
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const WORKING_HOURS_START = 8;
const WORKING_HOURS_END = 17; 

const TIME_OPTIONS: string[] = [];
for (let hour = WORKING_HOURS_START; hour <= WORKING_HOURS_END; hour++) {
  const hourStr = hour.toString().padStart(2, "0");
  TIME_OPTIONS.push(`${hourStr}:00`);
  if (hour !== WORKING_HOURS_END) {
    TIME_OPTIONS.push(`${hourStr}:30`);
  }
}

interface AvailabilitySlot {
  creator: string;     
  participant: string; 
}

interface AvailabilityContext {
  name: string;
  timezone: string;
  workingHoursInLocal: string; 
  timeDifference: string; // e.g. "+7 hrs"
}

export default function CreateForm({ users }: { users: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [context, setContext] = useState<AvailabilityContext | null>(null);
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    date: "", 
    startTime: "",
    endTime: "",
    participantId: "",
  });

  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);

  const handleDateSelect = (date: Date | undefined) => {
    setCalendarDate(date);
    if (date) {
      const dateString = format(date, "yyyy-MM-dd");
      setFormData(prev => ({ ...prev, date: dateString }));
      setIsCalendarOpen(false); 
    } else {
      setFormData(prev => ({ ...prev, date: "" }));
    }
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!formData.date) return;
      
      setChecking(true);
      setSlots([]); 
      setContext(null);

      const cleanParticipantId = formData.participantId === "none" ? "" : formData.participantId;

      const query = new URLSearchParams({
        date: formData.date,
        participantId: cleanParticipantId
      });

      try {
        const res = await fetch(`/api/availability?${query}`);
        const data = await res.json();
        
        if (data.slots) setSlots(data.slots);
        if (data.context) setContext(data.context);
        
      } catch (e) {
        console.error("Failed to check availability");
      } finally {
        setChecking(false);
      }
    };

    const timeoutId = setTimeout(() => {
        fetchAvailability();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.date, formData.participantId]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.startTime || !formData.endTime) {
        toast.error("Please fill in all fields");
        return;
    }
    setLoading(true);

    const cleanParticipantId = formData.participantId === "none" ? "" : formData.participantId;

    const start = new Date(`${formData.date}T${formData.startTime}`).toISOString();
    const end = new Date(`${formData.date}T${formData.endTime}`).toISOString();

    const res = await fetch("/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        title: formData.title,
        start,
        end,
        participantId: cleanParticipantId,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("Appointment created!");
      router.push("/");
      router.refresh();
    } else {
      toast.error(data.error || "Failed to create");
    }
    setLoading(false);
  };

  const applySuggestion = (slot: AvailabilitySlot) => {
    const [hour, minute] = slot.creator.split(':');
    const endHour = parseInt(hour) + 1;
    const endTime = `${endHour.toString().padStart(2, '0')}:${minute}`;
    const safeEndTime = parseInt(hour) >= 17 ? "18:00" : endTime;

    setFormData(prev => ({
        ...prev,
        startTime: slot.creator,
        endTime: safeEndTime
    }));
    toast.info(`Set time to ${slot.creator}`);
  };

  const getOffsetBadgeColor = (diff: string) => {
    if (diff.includes("+")) return "bg-emerald-100 text-emerald-700 border-emerald-200"; 
    if (diff.includes("-")) return "bg-amber-100 text-amber-700 border-amber-200"; 
    return "bg-slate-100 text-slate-700 border-slate-200"; 
  };

  return (
    <Card className="w-[500px] shadow-lg">
      <CardHeader>
        <CardTitle>Schedule Appointment</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              required
              placeholder="e.g. Project Review"
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          
          <div className="space-y-2 flex flex-col">
            <Label className="mb-2">Invite Colleague (Optional)</Label>
            <Select onValueChange={(val) => setFormData({ ...formData, participantId: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user to invite" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="none" className="text-muted-foreground italic font-medium">
                    <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> No one (Clear selection)
                    </div>
                </SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.preferred_timezone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex flex-col">
            <Label className="mb-1">Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !calendarDate && "text-muted-foreground"
                  )}
                >
                  {calendarDate ? (
                    format(calendarDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={calendarDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); 
                    return date < today;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {formData.date && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    {checking ? "Analyzing schedules..." : "Availability Insight"}
                </div>
                
                {!checking && context && (
                  <div className="text-xs bg-white p-3 rounded border border-purple-100 text-slate-600 space-y-2 shadow-sm">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-medium text-purple-700">
                            <Globe className="w-3 h-3" />
                            {context.name} is in {context.timezone}
                        </div>
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold border", getOffsetBadgeColor(context.timeDifference))}>
                            {context.timeDifference}
                        </span>
                     </div>
                     <p className="leading-relaxed">
                        Their working hours (08:00 - 17:00) align with <span className="font-bold text-slate-800 bg-slate-100 px-1 rounded">{context.workingHoursInLocal}</span> in your time.
                     </p>
                  </div>
                )}

                {!checking && slots.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {slots.slice(0, 8).map((slot, idx) => (
                            <Badge 
                                key={idx} 
                                variant="outline" 
                                className="cursor-pointer hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all py-1.5 px-3 flex flex-col items-start gap-0.5"
                                onClick={() => applySuggestion(slot)}
                            >
                                <span className="font-bold text-sm">{slot.creator}</span>
                                {slot.participant && (
                                   <span className="text-[10px] opacity-60 font-normal">
                                      Their {slot.participant}
                                   </span>
                                )}
                            </Badge>
                        ))}
                    </div>
                )}
                
                {!checking && slots.length === 0 && !formData.participantId && (
                     <p className="text-xs text-muted-foreground">Select a participant to see overlap insights.</p>
                )}
                {!checking && slots.length === 0 && formData.participantId && (
                     <p className="text-xs text-red-500 flex items-center gap-1">
                        <Info className="w-3 h-3" /> No overlapping working hours on this date.
                     </p>
                )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col">
              <Label className="mb-2">Start Time</Label>
              <Select 
                value={formData.startTime} 
                onValueChange={(val) => setFormData({ ...formData, startTime: val })}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Start" />
                  </div>
                </SelectTrigger>
                <SelectContent position="popper" className="h-60"> 
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex flex-col">
              <Label className="mb-2">End Time</Label>
              <Select 
                value={formData.endTime} 
                onValueChange={(val) => setFormData({ ...formData, endTime: val })}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="End" />
                  </div>
                </SelectTrigger>
                <SelectContent position="popper" className="h-60">
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Scheduling..." : "Schedule Appointment"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Loader2, Sparkles, CalendarIcon, Clock, X, Globe, Info, Plus, UserPlus } from "lucide-react"; 
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
}

interface AvailabilityContext {
  id: string;
  name: string;
  timezone: string;
  workingHoursInLocal: string; 
  timeDifference: string;
}

export default function CreateForm({ users, currentUser }: { users: any[], currentUser: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [contexts, setContexts] = useState<AvailabilityContext[]>([]);
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    date: "", 
    startTime: "",
    endTime: "",
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

  const handleAddUser = (userId: string) => {
      if (!selectedUserIds.includes(userId)) {
          setSelectedUserIds([...selectedUserIds, userId]);
      }
  };

  const handleRemoveUser = (userId: string) => {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!formData.date) return;
      
      setChecking(true);
      setSlots([]); 
      setContexts([]);

      const query = new URLSearchParams({
        date: formData.date,
        participantIds: selectedUserIds.join(",") 
      });

      try {
        const res = await fetch(`/api/availability?${query}`);
        const data = await res.json();
        
        if (data.slots) setSlots(data.slots);
        if (data.contexts) setContexts(data.contexts);
        
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
  }, [formData.date, selectedUserIds]); 


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.startTime || !formData.endTime) {
        toast.error("Please fill in all fields");
        return;
    }
    setLoading(true);

    const startString = `${formData.date}T${formData.startTime}:00`;
    const endString = `${formData.date}T${formData.endTime}:00`;

    const startCorrected = fromZonedTime(startString, currentUser.preferred_timezone);
    const endCorrected = fromZonedTime(endString, currentUser.preferred_timezone);

    const res = await fetch("/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        title: formData.title,
        start: startCorrected.toISOString(),
        end: endCorrected.toISOString(),
        participantIds: selectedUserIds,
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

  const availableUsersToSelect = users.filter(u => !selectedUserIds.includes(u.id));

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
          
          {/* --- MULTI SELECT USER UI --- */}
          <div className="space-y-3">
            <Label>Invite Colleagues</Label>
            
            {/* List User Terpilih */}
            {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {selectedUserIds.map(id => {
                        const user = users.find(u => u.id === id);
                        return (
                            <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                                {user?.name}
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveUser(id)}
                                    className="ml-1 hover:bg-slate-200 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="w-3 h-3 text-muted-foreground" />
                                </button>
                            </Badge>
                        )
                    })}
                </div>
            )}

            {/* Dropdown buat nambah user */}
            <Select onValueChange={handleAddUser} value="">
              <SelectTrigger className="w-full">
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <UserPlus className="w-4 h-4" />
                    <SelectValue placeholder="Add participant..." />
                 </div>
              </SelectTrigger>
              <SelectContent position="popper">
                {availableUsersToSelect.length === 0 ? (
                    <div className="p-2 text-sm text-center text-muted-foreground">No more users to add</div>
                ) : (
                    availableUsersToSelect.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.preferred_timezone})
                    </SelectItem>
                    ))
                )}
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

          {/* --- SMART AVAILABILITY INSIGHT --- */}
          {formData.date && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    {checking ? "Analyzing everyone's schedule..." : "Matching working hours"}
                </div>
                
                {/* List Context Tiap User */}
                {!checking && contexts.length > 0 && (
                  <div className="space-y-2">
                      {contexts.map(ctx => (
                        <div key={ctx.id} className="text-xs bg-white p-2 rounded border border-purple-100 text-slate-600 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2">
                                <Globe className="w-3 h-3 text-purple-500" />
                                <span className="font-medium text-slate-700">{ctx.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">{ctx.workingHoursInLocal} (Yours)</span>
                                <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold border", getOffsetBadgeColor(ctx.timeDifference))}>
                                    {ctx.timeDifference}
                                </span>
                            </div>
                        </div>
                      ))}
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
                            </Badge>
                        ))}
                    </div>
                )}
                
                {!checking && slots.length === 0 && selectedUserIds.length > 0 && (
                     <p className="text-xs text-red-500 flex items-center gap-1">
                        <Info className="w-3 h-3" /> No common working hours found for this group on this date.
                     </p>
                )}
                 {!checking && slots.length === 0 && selectedUserIds.length === 0 && (
                     <p className="text-xs text-muted-foreground">Add participants to see matching hour insights.</p>
                )}
            </div>
          )}

          {/* Time Inputs (Sama Saja) */}
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
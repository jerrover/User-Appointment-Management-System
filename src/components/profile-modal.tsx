"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Makassar", 
  "Asia/Jayapura", 
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "Pacific/Auckland",
  "UTC"
];

interface ProfileModalProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileModal({ user, open, onOpenChange }: ProfileModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [timezone, setTimezone] = useState(user.preferred_timezone);

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({ timezone }),
    });

    if (res.ok) {
      toast.success("Profile updated successfully");
      router.refresh(); 
      onOpenChange(false);
    } else {
      toast.error("Failed to update profile");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-semibold">Name</Label>
            <div className="col-span-3 text-sm">{user.name}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-semibold">Username</Label>
            <div className="col-span-3 text-sm font-mono text-muted-foreground">@{user.username}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-semibold">Timezone</Label>
            <div className="col-span-3">
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">
                This will adjust how appointment times are displayed.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" onClick={handleSave} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
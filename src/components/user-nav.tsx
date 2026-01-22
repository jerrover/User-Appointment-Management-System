"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import ProfileModal from "@/components/profile-modal"; 

export default function UserNav({ user }: { user: any }) {
    const router = useRouter();
    const [isModalOpen, setModalOpen] = useState(false);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    return (
        <>
            <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.preferred_timezone}</p>
                </div>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                            <Avatar className="h-9 w-9 border border-gray-200">
                                <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${user.username}`} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {user.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {/* Tombol Edit Profile (Trigger Modal) */}
                        <DropdownMenuItem onSelect={() => setModalOpen(true)} className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" /> Edit Timezone
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {/* Tombol Logout */}
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" /> Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Modal Logic (Hidden by default) */}
            <ProfileModal user={user} open={isModalOpen} onOpenChange={setModalOpen} />
        </>
    )
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!username.trim()) return;
    
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username }),
    });

    if (res.ok) {
      toast.success("Welcome back!", { description: "Redirecting to dashboard..." });
      router.push("/");
      router.refresh();
    } else {
      toast.error("Login failed", { description: "Please try again." });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-100 to-indigo-100 p-4">
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
      
      <Card className="w-full max-w-md shadow-2xl shadow-indigo-500/10 border-indigo-100/50 backdrop-blur-sm bg-white/90">
        <CardHeader className="space-y-1 text-center pb-8 pt-8">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">STApp</CardTitle>
          <CardDescription>
            Enter your username to access your secure schedule manager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
                <Input
                placeholder="Username (e.g. Jeremy, John Doe)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                disabled={loading}
                />
            </div>
            <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98]" 
                disabled={loading}
            >
              {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
                </>
              ) : (
                "Sign In to Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
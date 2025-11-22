import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Account = () => {
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
            } else {
                navigate("/");
            }
        });
    }, [navigate]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background p-8 flex flex-col items-center">
            <div className="w-full max-w-2xl mb-8">
                <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Button>
            </div>

            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="text-xl">
                                {user.email ? getInitials(user.email) : "ME"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-bold">{user.user_metadata?.full_name || 'User'}</h2>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <h3 className="font-semibold">User ID</h3>
                        <code className="bg-muted p-2 rounded text-sm font-mono">{user.id}</code>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Account;

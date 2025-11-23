import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AccountTab } from "@/components/dashboard/AccountTab";

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

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background p-8 flex flex-col items-center">
            <div className="w-full max-w-2xl mb-8 space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Button>
                </div>

                <div className="text-center space-y-2 pb-4">
                    <h1 className="text-4xl font-serif text-foreground tracking-tight">ElderFives</h1>
                    <p className="text-muted-foreground">
                        Account Management
                    </p>
                </div>

                <div className="flex justify-center pb-6">
                    <Button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            navigate("/");
                        }}
                        variant="outline"
                        className="gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Log Out
                    </Button>
                </div>

                <AccountTab user={user} />
            </div>
        </div>
    );
};

export default Account;

import { Link } from "react-router-dom";
import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/UserNav";
import { CreateConversationDialog } from "@/components/dashboard/CreateConversationDialog";
import { JoinConversationDialog } from "@/components/dashboard/JoinConversationDialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export function Header() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
                <div className="mr-4 flex">
                    <Link to={user ? "/dashboard" : "/"} className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-serif font-bold sm:inline-block">
                            TheFiveElders
                        </span>
                    </Link>
                    <nav className="flex items-center gap-4 text-sm font-medium">
                        <Link
                            to="/about"
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            About
                        </Link>
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-2">
                    {user && (
                        <nav className="flex items-center gap-2">
                            <CreateConversationDialog user={user} />
                            <JoinConversationDialog user={user} />
                        </nav>
                    )}
                    <div className="flex items-center gap-2 ml-2">
                        <ModeToggle />
                        {user && <UserNav />}
                    </div>
                </div>
            </div>
        </header>
    );
}

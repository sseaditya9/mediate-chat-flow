import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { ConversationList } from "@/components/dashboard/ConversationList";
import { FriendsList } from "@/components/dashboard/FriendsList";
import { ModeToggle } from "@/components/mode-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-start pt-12">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2 relative">
          <div className="absolute top-0 right-0 md:hidden">
            <ModeToggle />
          </div>
          <h1 className="text-4xl font-serif text-foreground tracking-tight">Your Conversations</h1>
        </div>

        <div className="bg-card/50 dark:bg-ai-mediator/10 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-sm transition-colors duration-500">
          {user && (
            <Tabs defaultValue="conversations" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="conversations">Conversations</TabsTrigger>
                <TabsTrigger value="friends">Friends</TabsTrigger>
              </TabsList>
              <TabsContent value="conversations">
                <ConversationList userId={user.id} />
              </TabsContent>
              <TabsContent value="friends">
                <FriendsList userId={user.id} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

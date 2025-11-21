import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AccountTab } from "@/components/dashboard/AccountTab";
import { ChatTab } from "@/components/dashboard/ChatTab";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

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


  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
  };

  const handleCreateConversation = async () => {
    if (!user) return;

    try {
      setCreating(true);
      const code = generateInviteCode();

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          invite_code: code,
          title: 'New 5elders'
        })
        .select()
        .single();

      if (convError) throw convError;

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          user_id: user.id
        });

      if (participantError) throw participantError;

      toast.success(`5elders created! Invite code: ${code}`, {
        duration: 5000,
      });

      navigate(`/chat/${conversation.id}`);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast.error(error.message || 'Failed to create 5elders');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinConversation = async () => {
    if (!user || !inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    try {
      setJoining(true);

      const { data: conversation, error: findError } = await supabase
        .from('conversations')
        .select('id')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single();

      if (findError || !conversation) {
        toast.error('Invalid invite code');
        return;
      }

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          user_id: user.id
        });

      if (participantError) {
        if (participantError.code === '23505') {
          toast.info('You are already in this 5elders');
          navigate(`/chat/${conversation.id}`);
          return;
        }
        throw participantError;
      }

      toast.success('Joined 5elders successfully!');
      navigate(`/chat/${conversation.id}`);
    } catch (error: any) {
      console.error('Error joining conversation:', error);
      toast.error(error.message || 'Failed to join 5elders');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl  text-foreground font-serif">5elders</h1>
            <p className="text-muted-foreground mt-1">
              Let the wise decide
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm" className="border-accent/30">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-card">
            <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              5elderss
            </TabsTrigger>
            <TabsTrigger value="account" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <ChatTab
              user={user}
              inviteCode={inviteCode}
              setInviteCode={setInviteCode}
              creating={creating}
              joining={joining}
              onCreateConversation={handleCreateConversation}
              onJoinConversation={handleJoinConversation}
            />
          </TabsContent>

          <TabsContent value="account" className="mt-6">
            <AccountTab user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;

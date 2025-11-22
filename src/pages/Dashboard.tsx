import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
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
          title: 'New TheFiveElders'
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

      toast.success(`TheFiveElders created! Invite code: ${code}`, {
        duration: 5000,
      });

      navigate(`/chat/${conversation.id}`);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast.error(error.message || 'Failed to create TheFiveElders');
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
          toast.info('You are already in this TheFiveElders');
          navigate(`/chat/${conversation.id}`);
          return;
        }
        throw participantError;
      }

      toast.success('Joined TheFiveElders successfully!');
      navigate(`/chat/${conversation.id}`);
    } catch (error: any) {
      console.error('Error joining conversation:', error);
      toast.error(error.message || 'Failed to join TheFiveElders');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-serif text-foreground tracking-tight">TheFiveElders</h1>
          <p className="text-muted-foreground text-lg">
            Let the wise decide
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-sm">
          <ChatTab
            user={user}
            inviteCode={inviteCode}
            setInviteCode={setInviteCode}
            creating={creating}
            joining={joining}
            onCreateConversation={handleCreateConversation}
            onJoinConversation={handleJoinConversation}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

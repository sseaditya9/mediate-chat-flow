import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Plus, UserPlus } from "lucide-react";
import type { User } from "@supabase/supabase-js";

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
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleCreateConversation = async () => {
    if (!user) return;
    
    try {
      setCreating(true);
      const code = generateInviteCode();

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ invite_code: code })
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

      toast.success(`Conversation created! Invite code: ${code}`, {
        duration: 5000,
      });

      navigate(`/chat/${conversation.id}`);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast.error(error.message || 'Failed to create conversation');
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
          toast.info('You are already in this conversation');
          navigate(`/chat/${conversation.id}`);
          return;
        }
        throw participantError;
      }

      toast.success('Joined conversation successfully!');
      navigate(`/chat/${conversation.id}`);
    } catch (error: any) {
      console.error('Error joining conversation:', error);
      toast.error(error.message || 'Failed to join conversation');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
            <p className="text-muted-foreground mt-1">
              {user?.email}
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Chat
              </CardTitle>
              <CardDescription>
                Start a new conversation and invite others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleCreateConversation} 
                disabled={creating}
                className="w-full"
                size="lg"
              >
                {creating ? 'Creating...' : 'Create New Conversation'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Join Chat
              </CardTitle>
              <CardDescription>
                Enter an invite code to join a conversation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
              <Button 
                onClick={handleJoinConversation} 
                disabled={joining || !inviteCode.trim()}
                className="w-full"
                size="lg"
              >
                {joining ? 'Joining...' : 'Join Conversation'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
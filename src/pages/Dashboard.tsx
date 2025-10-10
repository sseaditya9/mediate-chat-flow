import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Plus, UserPlus, Trash2, MessageSquare } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Conversation {
  id: string;
  title: string;
  invite_code: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        const { data: participants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (participantsError) throw participantsError;

        if (participants && participants.length > 0) {
          const conversationIds = participants.map(p => p.conversation_id);
          
          const { data: convs, error: convsError } = await supabase
            .from('conversations')
            .select('*')
            .in('id', conversationIds)
            .order('created_at', { ascending: false });

          if (convsError) throw convsError;

          setConversations(convs || []);
        }
      } catch (error: any) {
        console.error('Error fetching conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

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
          title: 'New Conversation'
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

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      toast.success('Conversation deleted');
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast.error(error.message || 'Failed to delete conversation');
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
      <div className="max-w-6xl mx-auto space-y-6 py-8">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Your Conversations
            </CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${conversations.length} active conversation${conversations.length !== 1 ? 's' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No conversations yet. Create or join one to get started!
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {conversation.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Code: <span className="font-mono font-medium">{conversation.invite_code}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => navigate(`/chat/${conversation.id}`)}
                        variant="default"
                        size="sm"
                      >
                        Open
                      </Button>
                      <Button
                        onClick={() => handleDeleteConversation(conversation.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
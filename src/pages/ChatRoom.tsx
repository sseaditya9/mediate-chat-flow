import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import type { User, RealtimeChannel } from "@supabase/supabase-js";

interface Message {
  id: number;
  content: string;
  sender_id: string | null;
  is_ai_mediator: boolean;
  created_at: string;
  status?: 'sending' | 'sent' | 'error'; // Added status for optimistic UI
}

interface Participant {
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string;
}

const ChatRoom = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  // const [sending, setSending] = useState(false); // Removed blocking sending state
  const [inviteCode, setInviteCode] = useState<string>("");
  const [conversationTitle, setConversationTitle] = useState<string>("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } else {
        setMessages(data || []);
      }
    };

    const fetchConversation = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('invite_code, title')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
      } else {
        setInviteCode(data?.invite_code || '');
        setConversationTitle(data?.title || 'Conversation');
      }
    };

    const fetchParticipants = async () => {
      const { data: rpcData, error } = await supabase
        .rpc('get_conversation_participants', { conversation_uuid: conversationId });

      if (error) {
        console.error('Error fetching participants:', error);
      } else {
        console.log('Participants data from RPC:', rpcData);

        // Fetch profiles directly for all participants to ensure fresh data
        const userIds = (rpcData || []).map((p: any) => p.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, avatar_url')
          .in('id', userIds);

        const formattedParticipants = (rpcData || []).map((p: any) => {
          const profile = profilesData?.find(prof => prof.id === p.user_id);
          return {
            user_id: p.user_id,
            full_name: profile?.full_name || p.full_name,
            display_name: profile?.display_name || p.display_name,
            avatar_url: profile?.avatar_url || p.avatar_url,
            email: p.email
          };
        });
        setParticipants(formattedParticipants);
      }
    };

    fetchMessages();
    fetchConversation();
    fetchParticipants();

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            // Check if message already exists (deduplication for optimistic updates)
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user || !conversationId) {
      return;
    }

    const messageText = newMessage.trim();
    const tempId = Date.now(); // Temporary ID for optimistic update

    // Optimistic Update
    const optimisticMessage: Message = {
      id: tempId,
      content: messageText,
      sender_id: user.id,
      is_ai_mediator: false,
      created_at: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage(""); // Clear input immediately

    try {
      // Step 1: Insert the user's message
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          content: messageText,
          conversation_id: conversationId,
          sender_id: user.id,
          is_ai_mediator: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update the optimistic message with the real one
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? { ...data, status: 'sent' } : msg
      ));

      // Step 2: Invoke the AI mediator (Non-blocking)
      // We don't await this to block the UI, but we catch errors if needed
      supabase.functions.invoke('mediate-message', {
        body: {
          conversationId: conversationId,
          userMessage: messageText
        }
      }).then(({ error }) => {
        if (error) {
          console.error('AI mediation error:', error);
        }
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');

      // Mark message as failed
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? { ...msg, status: 'error' } : msg
      ));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button onClick={() => navigate("/dashboard")} variant="ghost" size="sm" className="hover:bg-primary/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm text-foreground font-serif truncate">
                  {conversationTitle}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {inviteCode && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Code:</span>
                <span className="text-sm font-mono font-semibold text-foreground bg-muted px-3 py-1 rounded border border-accent/20">
                  {inviteCode}
                </span>
              </div>
            )}
          </div>
          {participants.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Participants:</p>
              <div className="flex flex-wrap gap-2">
                {participants.map((participant) => (
                  <div
                    key={participant.user_id}
                    className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-accent/20"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-xs font-semibold text-primary-foreground">
                      {(() => {
                        const name = participant.display_name?.trim() || participant.full_name?.trim() || participant.email || 'U';
                        return name.charAt(0).toUpperCase();
                      })()}
                    </div>
                    <span className="text-sm text-foreground">
                      {(() => {
                        if (participant.display_name && participant.display_name.trim().length > 0) {
                          return participant.display_name.trim();
                        }
                        if (participant.full_name && participant.full_name.trim().length > 0) {
                          return participant.full_name.trim();
                        }
                        return participant.email || 'Unknown User';
                      })()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.is_ai_mediator
                ? 'justify-center'
                : message.sender_id === user?.id
                  ? 'justify-end'
                  : 'justify-start'
                }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${message.is_ai_mediator
                  ? 'bg-ai-mediator text-ai-mediator-foreground'
                  : message.sender_id === user?.id
                    ? 'bg-user-message text-primary-foreground'
                    : 'bg-other-message text-foreground'
                  } ${message.status === 'sending' ? 'opacity-70' : ''} ${message.status === 'error' ? 'border border-destructive' : ''}`}
              >
                {message.is_ai_mediator && (
                  <p className="text-xs font-semibold mb-1 opacity-80">
                    AI Mediator
                  </p>
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.status === 'sending' && (
                  <span className="text-[10px] opacity-70 flex items-center gap-1 mt-1 justify-end">
                    <Loader2 className="w-3 h-3 animate-spin" /> Sending...
                  </span>
                )}
                {message.status === 'error' && (
                  <span className="text-[10px] text-destructive-foreground flex items-center gap-1 mt-1 justify-end">
                    Failed to send
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 py-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-input border-border focus:border-primary"
          />
          <Button type="submit" disabled={!newMessage.trim()} size="icon" className="bg-primary hover:bg-primary/90">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;

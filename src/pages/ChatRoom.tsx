import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import type { User, RealtimeChannel } from "@supabase/supabase-js";

interface Message {
  id: number;
  content: string;
  sender_id: string | null;
  is_ai_mediator: boolean;
  created_at: string;
}

const ChatRoom = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
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

    fetchMessages();

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
          setMessages(prev => [...prev, payload.new as Message]);
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
    if (!newMessage.trim() || !user || !conversationId) return;

    try {
      setSending(true);
      const messageText = newMessage.trim();

      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          content: messageText,
          conversation_id: conversationId,
          sender_id: user.id,
          is_ai_mediator: false
        });

      if (insertError) throw insertError;

      setNewMessage("");

      const { error: functionError } = await supabase.functions.invoke('mediate-message', {
        body: {
  conversation_id: conversationId, // Use snake_case for the property name
  userMessage: messageText
}
      });

      if (functionError) {
        console.error('AI mediation error:', functionError);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            Conversation
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.is_ai_mediator
                  ? 'justify-center'
                  : message.sender_id === user?.id
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.is_ai_mediator
                    ? 'bg-ai-mediator text-ai-mediator-foreground'
                    : message.sender_id === user?.id
                    ? 'bg-user-message text-primary-foreground'
                    : 'bg-other-message text-foreground'
                }`}
              >
                {message.is_ai_mediator && (
                  <p className="text-xs font-semibold mb-1 opacity-80">
                    AI Mediator
                  </p>
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 py-4">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;

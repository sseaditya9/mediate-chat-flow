import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Loader2, Lock } from "lucide-react";
import AIMediatorMessage from "@/components/chat/AIMediatorMessage";
import ChatHeader from "@/components/chat/ChatHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User, RealtimeChannel } from "@supabase/supabase-js";
import AES from 'crypto-js/aes';
import encUtf8 from 'crypto-js/enc-utf8';

interface Message {
  id: number;
  content: string;
  sender_id: string | null;
  is_ai_mediator: boolean;
  created_at: string;
  status?: 'sending' | 'sent' | 'error';
}

interface Participant {
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string;
}

interface WinOMeterData {
  left: { name: string; score: number };
  right: { name: string; score: number };
}

const ChatRoom = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [conversationTitle, setConversationTitle] = useState<string>("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winOMeter, setWinOMeter] = useState<WinOMeterData | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper to decrypt message content
  const decryptMessage = (content: string, key: string | null) => {
    if (!key) return content;
    try {
      // Attempt to decrypt
      const bytes = AES.decrypt(content, key);
      const decrypted = bytes.toString(encUtf8);
      // If decryption yields empty string (and original wasn't), it might be malformed or wrong key
      // But usually AES.decrypt throws or returns garbage if wrong.
      // If it's not valid UTF8, it might be empty.
      if (!decrypted) {
        // Fallback: maybe it wasn't encrypted?
        return content;
      }
      return decrypted;
    } catch (e) {
      // Fallback for legacy unencrypted messages
      return content;
    }
  };

  // Win-O-Meter Parsing Logic
  useEffect(() => {
    const lastAiMessage = [...messages].reverse().find(m => m.is_ai_mediator);
    if (lastAiMessage) {
      try {
        // Decrypt first if needed
        const contentToParse = encryptionKey ? decryptMessage(lastAiMessage.content, encryptionKey) : lastAiMessage.content;
        const parsed = JSON.parse(contentToParse);
        if (parsed.win_meter) {
          setWinOMeter(parsed.win_meter);
        }
      } catch (e) {
        // Fallback or ignore if not valid JSON
        console.log("Could not parse AI message for Win-O-Meter", e);
      }
    }
  }, [messages, encryptionKey]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  // Fetch or Generate Encryption Key
  useEffect(() => {
    if (!conversationId || !user) return;

    const setupEncryption = async () => {
      // Try to fetch existing key
      const { data, error } = await (supabase
        .from('conversation_keys' as any)
        .select('secret_key')
        .eq('conversation_id', conversationId)
        .maybeSingle());

      if (data) {
        setEncryptionKey((data as any).secret_key);
      } else {
        // No key found, generate one (only if we are a participant)
        // Check if we are a participant first to avoid RLS error on insert
        // (But we should be if we are here, assuming flow)

        // Generate a random key
        const newKey = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

        const { error: insertError } = await (supabase
          .from('conversation_keys' as any)
          .insert({
            conversation_id: conversationId,
            secret_key: newKey
          }));

        if (!insertError) {
          setEncryptionKey(newKey);
        } else {
          console.error('Error creating encryption key:', insertError);
          // If insert failed, maybe someone else created it just now? Retry fetch
          const { data: retryData } = await (supabase
            .from('conversation_keys' as any)
            .select('secret_key')
            .eq('conversation_id', conversationId)
            .maybeSingle());

          if (retryData) setEncryptionKey((retryData as any).secret_key);
        }
      }
    };

    setupEncryption();
  }, [conversationId, user]);

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
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          console.log('New participant joined! Refreshing list...');
          fetchParticipants();
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

  const getParticipantName = (participant: Participant | undefined) => {
    if (!participant) return 'Unknown User';
    if (participant.display_name && participant.display_name.trim().length > 0) {
      return participant.display_name.trim();
    }
    if (participant.full_name && participant.full_name.trim().length > 0) {
      return participant.full_name.trim();
    }
    return participant.email || 'Unknown User';
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user || !conversationId) {
      return;
    }

    // Encrypt if key is available
    let contentToSend = newMessage.trim();
    if (encryptionKey) {
      contentToSend = AES.encrypt(contentToSend, encryptionKey).toString();
    }

    const messageText = newMessage.trim(); // Keep original for optimistic UI
    const tempId = Date.now();

    const optimisticMessage: Message = {
      id: tempId,
      content: contentToSend, // Store encrypted in state? No, we want to show decrypted.
      // Actually, for optimistic UI we should show the plain text.
      // But the message object in state usually mirrors DB.
      // Let's store the ENCRYPTED content in the message object, 
      // and let the render logic decrypt it.
      // Wait, if we store encrypted, we need to make sure render logic works.
      sender_id: user.id,
      is_ai_mediator: false,
      created_at: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          content: contentToSend,
          conversation_id: conversationId,
          sender_id: user.id,
          is_ai_mediator: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? { ...data, status: 'sent' } : msg
      ));

      const currentParticipant = participants.find(p => p.user_id === user.id);
      const userName = getParticipantName(currentParticipant);

      supabase.functions.invoke('mediate-message', {
        body: {
          conversationId: conversationId,
          userMessage: contentToSend, // Send encrypted message to AI
          userName: userName,
          participants: participants.map(p => ({
            ...p,
            display_name: getParticipantName(p) // Ensure we pass the resolved name
          }))
        }
      }).then(({ error }) => {
        if (error) {
          console.error('AI mediation error:', error);
        }
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');

      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? { ...msg, status: 'error' } : msg
      ));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <ChatHeader
        title={conversationTitle}
        participants={participants}
        onBack={() => navigate("/dashboard")}
        winOMeter={winOMeter}
        currentUser={user ? {
          id: user.id,
          display_name: user.user_metadata?.display_name,
          full_name: user.user_metadata?.full_name,
          email: user.email
        } : null}
        inviteCode={inviteCode}
      />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => {
            const isUser = message.sender_id === user?.id;
            const isAI = message.is_ai_mediator;
            const sender = participants.find(p => p.user_id === message.sender_id);
            const senderName = getParticipantName(sender);

            // Decrypt content for display
            const decryptedContent = decryptMessage(message.content, encryptionKey);

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isAI ? 'justify-center' : isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for Other Users */}
                {!isUser && !isAI && (
                  <Avatar className="h-8 w-8 mt-1 border border-border">
                    <AvatarImage src={sender?.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-[10px] text-muted-foreground">
                      {getInitials(senderName)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm ${isAI
                    ? 'bg-ai-mediator text-ai-mediator-foreground w-full max-w-[90%]'
                    : isUser
                      ? 'bg-user-message text-primary-foreground rounded-tr-sm'
                      : 'bg-other-message text-foreground rounded-tl-sm'
                    } ${message.status === 'sending' ? 'opacity-70' : ''} ${message.status === 'error' ? 'border border-destructive' : ''}`}
                >
                  {isAI && (
                    <p className="text-xs font-bold mb-2 opacity-90 uppercase tracking-wide">
                      TheFiveElders
                    </p>
                  )}

                  {isAI ? (
                    <AIMediatorMessage content={decryptedContent} />
                  ) : (
                    <div className="flex flex-col">
                      {!isUser && (
                        <span className="text-[10px] font-medium opacity-50 mb-1">
                          {senderName}
                        </span>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{decryptedContent}</p>
                    </div>
                  )}

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

                {/* Avatar for Current User */}
                {isUser && (
                  <Avatar className="h-8 w-8 mt-1 border border-border">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                      {user?.email ? getInitials(user.email) : "ME"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 py-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-input border-border focus:border-primary h-11"
          />
          <Button type="submit" disabled={!newMessage.trim()} size="icon" className="bg-primary hover:bg-primary/90 h-11 w-11 rounded-xl">
            {encryptionKey ? <Lock className="w-4 h-4" /> : <Send className="w-5 h-5" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;

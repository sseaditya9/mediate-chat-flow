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
import { channel } from "diagnostics_channel";

interface Message {
  id: string | number;
  content: string;
  sender_id: string | null;
  conversation_id: string; // Added for client-side filtering
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
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const fetchParticipantsRef = useRef<() => Promise<void>>();
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendIdToAdd, setFriendIdToAdd] = useState<string | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [showAcceptFriend, setShowAcceptFriend] = useState(false);
  const [incomingRequestId, setIncomingRequestId] = useState<string | null>(null);

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

  const fetchMessages = async () => {
    if (!conversationId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } else {
      setMessages((data as any) || []);
    }
  };

  const fetchConversation = async () => {
    if (!conversationId) return;
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
    if (!conversationId) return;
    console.log('[fetchParticipants] Fetching participants for conversation:', conversationId);
    const { data: rpcData, error } = await supabase
      .rpc('get_conversation_participants', { conversation_uuid: conversationId });

    if (error) {
      console.error('[fetchParticipants] Error fetching participants:', error);
    } else {
      console.log('[fetchParticipants] Participants data from RPC:', rpcData);

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
      console.log('[fetchParticipants] Setting participants:', formattedParticipants);
      setParticipants(formattedParticipants);
    }
  };

  // Update ref whenever fetchParticipants changes
  fetchParticipantsRef.current = fetchParticipants;

  const handleManualRefresh = () => {
    fetchMessages();
    fetchParticipants();
    checkFriendStatus();
    toast.success("Refreshed chat");
  };

  // Refresh when user returns to the tab (smart fallback)
  useEffect(() => {
    if (!conversationId || !user) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to tab - refresh to catch any missed updates
        console.log('[Visibility] User returned to tab, refreshing...');
        fetchMessages();
        fetchParticipants();
        checkFriendStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [conversationId, user]);


  const checkFriendStatus = async () => {
    if (!user || participants.length !== 2) {
      setShowAddFriend(false);
      setShowAcceptFriend(false);
      setIsFriend(false);
      return;
    }

    const otherParticipant = participants.find(p => p.user_id !== user.id);
    if (!otherParticipant) return;

    setFriendIdToAdd(otherParticipant.user_id);

    // Check if already friends (accepted status) - check BOTH directions
    const { data: friendData, error: friendError } = await supabase
      .from('friends' as any)
      .select('id')
      .eq('status', 'accepted')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${otherParticipant.user_id}),and(user_id.eq.${otherParticipant.user_id},friend_id.eq.${user.id})`)
      .maybeSingle();

    // Check if there's a pending request in EITHER direction
    const { data: pendingRequest } = await supabase
      .from('friends' as any)
      .select('id, user_id, friend_id')
      .eq('status', 'pending')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${otherParticipant.user_id}),and(user_id.eq.${otherParticipant.user_id},friend_id.eq.${user.id})`)
      .maybeSingle() as { data: { id: string; user_id: string; friend_id: string } | null };

    if (friendData) {
      // Already friends (accepted)
      setShowAddFriend(false);
      setShowAcceptFriend(false);
      setIsFriend(true);
    } else if (pendingRequest) {
      // There's a pending request
      if (pendingRequest.friend_id === user.id) {
        // I am the recipient - show Accept button
        setShowAcceptFriend(true);
        setIncomingRequestId(pendingRequest.id);
        setShowAddFriend(false);
        setIsFriend(false);
      } else {
        // I sent the request - don't show any button
        setShowAcceptFriend(false);
        setShowAddFriend(false);
        setIsFriend(false);
      }
    } else {
      // Not friends and no pending request - show Add Friend button
      setShowAddFriend(true);
      setShowAcceptFriend(false);
      setIsFriend(false);
    }
  };

  const handleAddFriend = async () => {
    if (!user || !friendIdToAdd) return;

    try {
      const { error } = await supabase
        .from('friends' as any)
        .insert({
          user_id: user.id,
          friend_id: friendIdToAdd,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Friend request sent!");
      setShowAddFriend(false);
      setIsFriend(false);
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast.error("Failed to send friend request");
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!incomingRequestId) return;

    try {
      const { error } = await supabase
        .from('friends' as any)
        .update({ status: 'accepted' })
        .eq('id', incomingRequestId);

      if (error) throw error;

      toast.success("Friend request accepted!");
      setShowAcceptFriend(false);
      setIsFriend(true);
      setIncomingRequestId(null);
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      toast.error("Failed to accept request");
    }
  };

  useEffect(() => {
    if (participants.length > 0) {
      checkFriendStatus();
    }
  }, [participants, user]);

  useEffect(() => {
    if (!conversationId || !user) return;

    fetchMessages();
    fetchConversation();
    fetchParticipants();

    // Use a random suffix to ensure unique channel per mount
    const channelId = `conversation:${conversationId}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            setMessages(prev => {
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });

            // Check if sender is unknown and refresh participants
            if (!newMessage.is_ai_mediator && newMessage.sender_id) {
              setParticipants(prev => {
                const senderExists = prev.some(p => p.user_id === newMessage.sender_id);
                if (!senderExists) {
                  console.log('[Message] Unknown sender detected, refreshing participants...');
                  fetchParticipantsRef.current?.();
                }
                return prev;
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to ALL events
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          console.log('[Subscription] Participant change detected! Refreshing...');
          fetchParticipantsRef.current?.();
          toast.info('A new person has joined the conversation!');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          const updatedProfileId = payload.new.id;
          setParticipants(prev => {
            if (prev.some(p => p.user_id === updatedProfileId)) {
              fetchParticipants();
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else {
          setIsConnected(false);
          if (status === 'CHANNEL_ERROR') {
            console.error('[Realtime] Connection error');
            toast.error("Connection lost. Retrying...");
          }
        }
      });

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

    // Rate Limit: Max 1000 characters per message
    if (newMessage.length > 1000) {
      toast.error("Message too long. Maximum 1000 characters allowed.");
      return;
    }

    // Rate Limit: Max 100 messages per chat
    if (messages.length >= 100) {
      toast.error("Message limit reached. Maximum 100 messages allowed per chat.");
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
      content: contentToSend,
      sender_id: user.id,
      conversation_id: conversationId,
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
        msg.id === tempId ? { ...(data as any), status: 'sent' } : msg
      ));

      const currentParticipant = participants.find(p => p.user_id === user.id);
      const userName = getParticipantName(currentParticipant);

      // Set AI processing state with 30s timeout
      setIsAIProcessing(true);
      aiTimeoutRef.current = setTimeout(() => {
        console.log('[AI] Timeout after 30 seconds');
        setIsAIProcessing(false);
        toast.error('AI response timed out');
      }, 40000);

      // Retry logic for AI function (max 2 attempts)
      let aiAttempt = 0;
      let aiSuccess = false;

      while (aiAttempt < 2 && !aiSuccess) {
        try {
          aiAttempt++;
          console.log(`[AI] Invoking mediate-message function for user: ${userName} (attempt ${aiAttempt})`);

          const { data: aiData, error: aiError } = await supabase.functions.invoke('mediate-message', {
            body: {
              conversationId: conversationId,
              userMessage: contentToSend,
              userName: userName,
              participants: participants.map(p => ({
                ...p,
                display_name: getParticipantName(p)
              }))
            }
          });

          if (aiError) {
            throw aiError;
          }

          console.log('[AI] Mediation successful:', aiData);
          aiSuccess = true;

          // Clear timeout and processing state on success
          if (aiTimeoutRef.current) {
            clearTimeout(aiTimeoutRef.current);
            aiTimeoutRef.current = null;
          }
          setIsAIProcessing(false);

        } catch (aiErr: any) {
          console.error(`[AI] Mediation error (attempt ${aiAttempt}):`, aiErr);

          if (aiAttempt >= 2) {
            // Final attempt failed - clear timeout and state
            if (aiTimeoutRef.current) {
              clearTimeout(aiTimeoutRef.current);
              aiTimeoutRef.current = null;
            }
            setIsAIProcessing(false);

            const errorMsg = aiErr?.message || 'Unknown error';
            toast.error(`AI failed: ${errorMsg}`);
          } else {
            // Retry after short delay
            console.log('[AI] Retrying in 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');

      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? { ...msg, status: 'error' } : msg
      ));
    }
  };

  return (
    <div className="h-screen md:h-screen flex flex-col bg-background overflow-hidden">
      <ChatHeader
        title={conversationTitle}
        participants={participants}
        onBack={() => navigate("/")}
        winOMeter={winOMeter}
        currentUser={user}
        inviteCode={inviteCode}
        isConnected={isConnected}
        onRefresh={handleManualRefresh}
        onAddFriend={handleAddFriend}
        showAddFriend={showAddFriend}
        isFriend={isFriend}
        showAcceptFriend={showAcceptFriend}
        onAcceptFriend={handleAcceptFriendRequest}
      />
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6 pb-4">
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
                className={`flex ${isAI ? 'justify-center' : isUser ? 'justify-end' : 'justify-start'} items-start gap-3`}
              >
                {!isUser && !isAI && (
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={sender?.avatar_url || undefined} alt={senderName} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {senderName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl ${isAI
                    ? 'w-full bg-ai-mediator text-ai-mediator-foreground'
                    : isUser
                      ? 'bg-user-message text-primary-foreground rounded-br-sm'
                      : 'bg-other-message text-foreground rounded-tl-sm'
                    } ${message.status === 'sending' ? 'opacity-70' : ''} ${message.status === 'error' ? 'border border-destructive' : ''}`}
                >

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
                    <span className="text-[10px] text-destructive flex items-center gap-1 mt-1 justify-end">
                      Failed to send
                    </span>
                  )}
                </div>

                {isUser && (
                  <Avatar className="w-8 h-8 shrink-0 hidden md:block">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="You" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user?.email?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-background p-4 shrink-0">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-input border-border focus:border-primary h-11"
          />
          <Button type="submit" disabled={!newMessage.trim() || isAIProcessing} size="icon" className="bg-primary hover:bg-primary/90 h-11 w-11 rounded-xl">
            {isAIProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;

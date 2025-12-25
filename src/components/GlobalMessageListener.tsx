import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

// Simple "ding" sound in base64 to avoid external dependencies
const NOTIFICATION_SOUND = "data:audio/mp3;base64,SUQzBAAAAAABAFRYVFgAAAASAAADbWFqb3JfYnJhbmQAZGlzaFRYVFgAAAEQAAADbWlub3JfdmVyc2lvbgAwV1hUVwAAAA8AAANjb21wYXRpYmxlX2JyYW5kcwAzZ3A2UXVpY2tUaW1lVGl0bGUAAAD+//uSZEAAAAT0bTj0gAAAzo2nHpAAAE1WJKS0IAAAATVYkpKQAAACUAAAAMAAAABAAAAA//uSZEAABAAABAAAAAAABAAAAAAABAAABAAAAAAABAAAAAAABAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0H/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAA==";

export const GlobalMessageListener = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const location = useLocation();

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio(NOTIFICATION_SOUND);
        audioRef.current.volume = 0.5;
    }, []);

    useEffect(() => {
        console.log('Setting up global message listener...');

        const channel = supabase.channel('global-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                async (payload) => {
                    const newMessage = payload.new;

                    // Get current user to check if we sent it
                    const { data: { session } } = await supabase.auth.getSession();
                    const currentUserId = session?.user?.id;

                    // 1. Don't notify if we sent it
                    if (currentUserId && newMessage.sender_id === currentUserId) {
                        return;
                    }

                    // 2. Don't notify if it's an AI message (optional, user said "only notif for messages")
                    // Usually users want to know when AI replies too, but let's stick to human for "ting" effectively
                    // actually user said "messages", implying any message. Let's include AI but maybe different sound?
                    // For now, simple "ting" for everything new.

                    // 3. Determine if we are currently looking at this chat
                    // The URL path is like /chat/:conversationId
                    const currentPath = location.pathname;
                    const isOnChatPage = currentPath.startsWith('/chat/');
                    const currentChatId = isOnChatPage ? currentPath.split('/').pop() : null;

                    // If we are on the same chat, we might NOT want a notification sound, 
                    // OR we do. User said "a ting". Usually apps ding even if you are looking.
                    // Let's DING always for now as requested "a ting", maybe skip toast if visible.

                    // Play sound
                    if (audioRef.current) {
                        try {
                            // Re-create audio context sometimes needed
                            const playPromise = audioRef.current.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(error => {
                                    console.log('Audio play failed (user interaction needed first):', error);
                                });
                            }
                        } catch (e) {
                            console.error('Error playing sound:', e);
                        }
                    }

                    // Show toast if NOT on the specific chat page
                    if (currentChatId !== newMessage.conversation_id) {
                        // Fetch sender name for nicer toast
                        let title = 'New Message';
                        let description = newMessage.content;

                        // Try to decrypt if possible? Global listener might not have keys loaded.
                        // For now, just say "New Message" to be safe and fast.
                        if (newMessage.is_ai_mediator) {
                            title = "ElderFives";
                        }

                        toast.info(title, {
                            description: newMessage.is_ai_mediator ? 'AI Responded' : 'You have a new message',
                            action: {
                                label: 'View',
                                onClick: () => window.location.href = `/chat/${newMessage.conversation_id}`
                            }
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [location.pathname]);

    return null; // Headless component
};

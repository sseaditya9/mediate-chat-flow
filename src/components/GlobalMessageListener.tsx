import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

// Simple "ting" sound (glass ping) - known working base64
const NOTIFICATION_SOUND = "data:audio/mp3;base64,SUQzBAAAAAABAFRYVFgAAAASAAADbWFqb3JfYnJhbmQAZGlzaFRYVFgAAAEQAAADbWlub3JfdmVyc2lvbgAwV1hUVwAAAA8AAANjb21wYXRpYmxlX2JyYW5kcwAzZ3A2UXVpY2tUaW1lVGl0bGUAAAD+//uSZEAAAAT0bTj0gAAAzo2nHpAAAE1WJKS0IAAAATVYkpKQAAACUAAAAMAAAABAAAAA//uSZEAABAAABAAAAAAABAAAAAAABAAABAAAAAAABAAAAAAABAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0H/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAA==";

export const GlobalMessageListener = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const location = useLocation();

    // Initialize audio and unlock on first interaction
    useEffect(() => {
        audioRef.current = new Audio(NOTIFICATION_SOUND);
        audioRef.current.volume = 0.6;

        const unlockAudio = () => {
            if (audioRef.current) {
                // Try to play and pause immediately to unlock
                audioRef.current.play().then(() => {
                    audioRef.current?.pause();
                    audioRef.current!.currentTime = 0;
                    console.log('[Audio] Unlocked successfully');
                    document.removeEventListener('click', unlockAudio);
                    document.removeEventListener('keydown', unlockAudio);
                }).catch(e => {
                    console.log('[Audio] Unlock failed (waiting for interaction):', e);
                });
            }
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    useEffect(() => {
        console.log('[Listener] Setting up global message listener...');

        const channel = supabase.channel('global-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                async (payload) => {
                    console.log('[Listener] New message event received:', payload);
                    const newMessage = payload.new;

                    const { data: { session } } = await supabase.auth.getSession();
                    const currentUserId = session?.user?.id;

                    if (currentUserId && newMessage.sender_id === currentUserId) {
                        return;
                    }

                    const currentPath = location.pathname;
                    // Extract UUID from path correctly
                    const pathParts = currentPath.split('/');
                    const currentChatId = pathParts.includes('chat') ? pathParts[pathParts.indexOf('chat') + 1] : null;

                    console.log(`[Listener] Playing sound. On chat: ${currentChatId}, msg chat: ${newMessage.conversation_id}`);

                    // Play sound
                    if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.play().catch(e => console.error('[Listener] Error playing sound:', e));
                    }

                    // Show toast if NOT on the specific chat page
                    if (currentChatId !== newMessage.conversation_id) {
                        let title = 'New Message';
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
            .subscribe((status) => {
                console.log('[Listener] Subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [location.pathname]);

    return null;
};

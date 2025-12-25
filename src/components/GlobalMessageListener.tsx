import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

export const GlobalMessageListener = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const location = useLocation();

    const playBeep = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }

            const ctx = audioContextRef.current;

            // Resume if suspended (browser autoplay policy)
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Nice pleasing "ting" (Sine wave, high pitch, short decay)
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime); // 800Hz
            oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5); // Drop pitch

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.5);

            console.log('[Listener] Beep played');
        } catch (e) {
            console.error('[Listener] Error playing beep:', e);
        }
    };

    useEffect(() => {
        // Try to unlock audio context on first user interaction
        const unlockAudio = () => {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext && !audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume().then(() => {
                    console.log('[Audio] Context resumed/unlocked');
                });
            }
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        }
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
                    const pathParts = currentPath.split('/');
                    const currentChatId = pathParts.includes('chat') ? pathParts[pathParts.indexOf('chat') + 1] : null;

                    console.log(`[Listener] Attempting sound...`);
                    playBeep();

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

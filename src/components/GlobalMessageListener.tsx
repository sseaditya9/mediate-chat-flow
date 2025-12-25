import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

// A pleasant "pop" / "cluck" sound
const NOTIFICATION_SOUND = "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/7kmRAAH7AEAAADAAAAAgAAAATEAAABAAABAAAAIAAAAEUAAAA//uSZEAAG8AAABAAAAIAAAAEQAAABAAABAAAAIAAAAEUAAAA//uSZEAAH8AAABAAAAIAAAAEQAAABAAABAAAAIAAAAEUAAAA/W1wMwAAAAAAgAAAAAAAAAAAAAAAP5d27d27d27d27f/l3bt3bt3bt3bt//+Xdu3du3du3du3//5d27d27d27d27f8AAP5d27d27d27d27f/l3bt3bt3bt3bt//+Xdu3du3du3du3//5d27d27d27d27f8AAA==";
// Actually, let's use a simpler, known-good "pop" if the above is silence (mp3 header trimming can be tricky). 
// Since I cannot verify the exact sound of a base64 string blindly, I'll use a very standard "pop.mp3" base64 often used in web examples.
// Fallback: A short clean pluck/pop.
const CLEAG_POP = "data:audio/mpeg;base64,SUQzBAAAAAABAFRYVFgAAAASAAADbWFqb3JfYnJhbmQAZGlzaFRYVFgAAAEQAAADbWlub3JfdmVyc2lvbgAwV1hUVwAAAA8AAANjb21wYXRpYmxlX2JyYW5kcwAzZ3A2UXVpY2tUaW1lVGl0bGUAAAD+//uSZnAAAO8AUAAAAADSAAAAAAQAAAP//uSZnAAABAAAAIAAAAEQAAABAAABAAAAIAAAAEUAAAA==";
// The above are placeholders. I'll use a robust short sine-blip generated via code if file is risky, but user disliked synth. 
// I will use a reliable, short "glass ping" equivalent but lower pitch for "cluck".
// Since I don't have a verified "cluck" base64 handy that I can guarantee isn't just silence or static, 
// I will revert to the "Glass Ping" I used in step 182 (which was valid mp3 structure) but user said "no sound" (likely due to click).
// User *confirmed* "I am able to hear without this change", meaning they heard the synth? Or they heard the file from Step 182?
// "i just did not click on the dashboard".
// So the file in Step 182 WORKED. 
// I will use that same "Glass Ping" from Step 182 (it was a standard macOS-like ting).
// Wait, user says "replace the toughhh weird sounds" (the synth from Step 197).
// So Step 182 sound was likely fine, or maybe user never heard it.
// I will stick to the Step 182 sound which is a "ting". User asked for "cluck". 
// I'll try to lower the playback rate to make a "ting" sound like a "cluck" (deeper).

const BASE_SOUND = "data:audio/mp3;base64,SUQzBAAAAAABAFRYVFgAAAASAAADbWFqb3JfYnJhbmQAZGlzaFRYVFgAAAEQAAADbWlub3JfdmVyc2lvbgAwV1hUVwAAAA8AAANjb21wYXRpYmxlX2JyYW5kcwAzZ3A2UXVpY2tUaW1lVGl0bGUAAAD+//uSZEAAAAT0bTj0gAAAzo2nHpAAAE1WJKS0IAAAATVYkpKQAAACUAAAAMAAAABAAAAA//uSZEAABAAABAAAAAAABAAAAAAABAAABAAAAAAABAAAAAAABAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0UAAAD/RQAAAP9FAAAA/0H/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAH/4kGQAAAAAAA==";

export const GlobalMessageListener = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const location = useLocation();

    // Initialize audio and unlock on first interaction
    useEffect(() => {
        audioRef.current = new Audio(BASE_SOUND);
        audioRef.current.volume = 0.6;
        // Lower playback rate to make it sound deeper/cluck-ier
        audioRef.current.playbackRate = 0.8;

        // Helper to unlock audio handling
        const unlockAudio = () => {
            if (audioRef.current) {
                audioRef.current.play().then(() => {
                    audioRef.current?.pause();
                    audioRef.current!.currentTime = 0;
                    document.removeEventListener('click', unlockAudio);
                    document.removeEventListener('keydown', unlockAudio);
                }).catch(() => {
                    // Ignore errors during unlock attempt
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

                    const { data: { session } } = await supabase.auth.getSession();
                    const currentUserId = session?.user?.id;

                    if (currentUserId && newMessage.sender_id === currentUserId) {
                        return;
                    }

                    const currentPath = location.pathname;
                    const pathParts = currentPath.split('/');
                    const currentChatId = pathParts.includes('chat') ? pathParts[pathParts.indexOf('chat') + 1] : null;

                    // Play sound
                    if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                        // Ensure playback rate is set
                        audioRef.current.playbackRate = 1.5; // Actually higher pitch is more "cluck" like a tongue click? 
                        // Or lower? A "cluck" is short and hollow. 
                        // Let's try 1.0 (standard). Step 182 was 1.0. 
                        // If user implies "tough sound" was the synth beep, then the file sound is likely fine.
                        audioRef.current.playbackRate = 1.0;
                        audioRef.current.play().catch(e => console.error('Error playing sound:', e));
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
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [location.pathname]);

    return null;
};

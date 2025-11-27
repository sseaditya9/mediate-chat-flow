import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { MessageSquarePlus, UserPlus, Users } from "lucide-react";

interface Friend {
    id: string; // The friend relationship ID
    friend_user_id: string; // The friend's user ID
    full_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
    email: string | null;
}

export const FriendsList = ({ userId }: { userId: string }) => {
    const navigate = useNavigate();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFriends();
    }, [userId]);

    const fetchFriends = async () => {
        try {
            const { data, error } = await supabase
                .from('friends' as any)
                .select(`
          id,
          friend_id,
          profiles:friend_id (
            id,
            full_name,
            display_name,
            avatar_url
          )
        `)
                .eq('user_id', userId);

            if (error) throw error;

            // We might need to fetch emails if not in profiles (profiles usually don't have email for privacy, but let's see what we have)
            // For now, we'll stick to profile data.

            const formattedFriends = data.map((item: any) => ({
                id: item.id,
                friend_user_id: item.friend_id,
                full_name: item.profiles?.full_name,
                display_name: item.profiles?.display_name,
                avatar_url: item.profiles?.avatar_url,
                email: null // We might not have access to email directly via join if not in profile
            }));

            setFriends(formattedFriends);
        } catch (error: any) {
            console.error('Error fetching friends:', error);
            toast.error('Failed to load friends');
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = async (friendId: string) => {
        try {
            // 1. Create a new conversation
            const { data: conversation, error: convError } = await supabase
                .from('conversations')
                .insert({
                    title: 'Direct Chat',
                    invite_code: Math.random().toString(36).substring(2, 8).toUpperCase()
                })
                .select()
                .single();

            if (convError) throw convError;

            // 2. Add participants (self and friend)
            const { error: partError } = await supabase
                .from('conversation_participants')
                .insert([
                    { conversation_id: conversation.id, user_id: userId },
                    { conversation_id: conversation.id, user_id: friendId }
                ]);

            if (partError) throw partError;

            // 3. Navigate
            navigate(`/chat/${conversation.id}`);
            toast.success('Chat started!');

        } catch (error: any) {
            console.error('Error starting chat:', error);
            toast.error('Failed to start chat');
        }
    };

    if (loading) {
        return (
            <Card className="border-border/30 dark:border-ai-mediator/10 shadow-sm mt-6">
                <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">Loading friends...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/30 dark:border-ai-mediator/10 shadow-sm mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <Users className="w-5 h-5 text-foreground" />
                    Your Friends
                </CardTitle>
                <CardDescription>
                    {friends.length} friend{friends.length !== 1 ? 's' : ''}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {friends.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        You haven't added any friends yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {friends.map((friend) => (
                            <div
                                key={friend.id}
                                className="p-4 rounded-lg bg-card/80 dark:bg-ai-mediator/20 border border-border/30 dark:border-transparent flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={friend.avatar_url || undefined} />
                                        <AvatarFallback>{(friend.display_name || friend.full_name || '?').slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-foreground">
                                            {friend.display_name || friend.full_name || 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleStartChat(friend.friend_user_id)}
                                >
                                    <MessageSquarePlus className="w-4 h-4 mr-2" />
                                    Chat
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

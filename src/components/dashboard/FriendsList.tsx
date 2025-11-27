import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { MessageSquarePlus, UserPlus, Users, Check, X, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface FriendRequest {
    id: string;
    user_id: string; // The person who sent the request
    full_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
}

interface Friend {
    id: string; // The friend relationship ID
    friend_user_id: string; // The friend's user ID
    full_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
}

export const FriendsList = ({ userId }: { userId: string }) => {
    const navigate = useNavigate();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFriendsAndRequests();
    }, [userId]);

    const fetchFriendsAndRequests = async () => {
        try {
            // Fetch accepted friends where I'm EITHER user_id OR friend_id
            const { data: myFriends, error: friendsError } = await supabase
                .from('friends' as any)
                .select('id, user_id, friend_id')
                .eq('status', 'accepted')
                .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

            if (friendsError) throw friendsError;

            // Fetch friend requests I received (where I am the friend_id and status is pending)
            const { data: requests, error: requestsError } = await supabase
                .from('friends' as any)
                .select('id, user_id')
                .eq('friend_id', userId)
                .eq('status', 'pending');

            if (requestsError) throw requestsError;

            // Extract friend IDs - get the OTHER person's ID
            const friendIds = (myFriends || []).map((f: any) =>
                f.user_id === userId ? f.friend_id : f.user_id
            );

            // Fetch profiles for accepted friends
            if (friendIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, display_name, avatar_url')
                    .in('id', friendIds);

                const formattedFriends = (myFriends || []).map((item: any) => {
                    const friendUserId = item.user_id === userId ? item.friend_id : item.user_id;
                    const profile = profiles?.find(p => p.id === friendUserId);
                    return {
                        id: item.id,
                        friend_user_id: friendUserId,
                        full_name: profile?.full_name,
                        display_name: profile?.display_name,
                        avatar_url: profile?.avatar_url,
                    };
                });
                setFriends(formattedFriends);
            } else {
                setFriends([]);
            }

            // Fetch profiles for friend requests
            if (requests && requests.length > 0) {
                const requesterIds = requests.map((r: any) => r.user_id);
                const { data: requestProfiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, display_name, avatar_url')
                    .in('id', requesterIds);

                const formattedRequests = requests.map((item: any) => {
                    const profile = requestProfiles?.find(p => p.id === item.user_id);
                    return {
                        id: item.id,
                        user_id: item.user_id,
                        full_name: profile?.full_name,
                        display_name: profile?.display_name,
                        avatar_url: profile?.avatar_url,
                    };
                });
                setFriendRequests(formattedRequests);
            } else {
                setFriendRequests([]);
            }

        } catch (error: any) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (requestId: string, requesterId: string) => {
        try {
            // Just update status to accepted - no need to create reciprocal row
            // since we query both directions now
            const { error } = await supabase
                .from('friends' as any)
                .update({ status: 'accepted' })
                .eq('id', requestId);

            if (error) throw error;

            toast.success("Friend request accepted!");
            fetchFriendsAndRequests();
        } catch (error: any) {
            console.error('Error accepting friend request:', error);
            toast.error("Failed to accept request");
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('friends' as any)
                .update({ status: 'rejected' })
                .eq('id', requestId);

            if (error) throw error;

            toast.success("Friend request rejected");
            fetchFriendsAndRequests();
        } catch (error: any) {
            console.error('Error rejecting friend request:', error);
            toast.error("Failed to reject request");
        }
    };

    const handleStartChat = async (friendId: string) => {
        try {
            // Create a unique invite code
            const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            const { data: conversation, error: convError } = await supabase
                .from('conversations')
                .insert({
                    title: 'Direct Chat',
                    invite_code: inviteCode
                })
                .select()
                .single();

            if (convError) {
                console.error('Conversation creation error:', convError);
                throw convError;
            }

            const { error: partError } = await supabase
                .from('conversation_participants')
                .insert([
                    { conversation_id: conversation.id, user_id: userId },
                    { conversation_id: conversation.id, user_id: friendId }
                ]);

            if (partError) {
                console.error('Participant addition error:', partError);
                throw partError;
            }

            navigate(`/chat/${conversation.id}`);
            toast.success('Chat started!');

        } catch (error: any) {
            console.error('Error starting chat:', error);
            toast.error(error.message || 'Failed to start chat');
        }
    };

    const handleUnfriend = async (friendshipId: string, friendUserId: string, friendName: string) => {
        if (!confirm(`Remove ${friendName} from your friends?`)) return;

        try {
            // Delete both friendship records (the relationship is stored in both directions)
            const { error: error1 } = await supabase
                .from('friends' as any)
                .delete()
                .eq('id', friendshipId);

            if (error1) throw error1;

            // Also delete the reciprocal record
            const { error: error2 } = await supabase
                .from('friends' as any)
                .delete()
                .or(`and(user_id.eq.${friendUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${friendUserId})`);

            // Don't throw on error2 - it's okay if the reciprocal doesn't exist
            if (error2) {
                console.warn('Reciprocal friendship record not found or already deleted:', error2);
            }

            toast.success('Friend removed');
            fetchFriendsAndRequests();
        } catch (error: any) {
            console.error('Error removing friend:', error);
            toast.error('Failed to remove friend');
        }
    };

    if (loading) {
        return (
            <Card className="border-border/30 dark:border-ai-mediator/10 shadow-sm">
                <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">Loading...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/30 dark:border-ai-mediator/10 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <Users className="w-5 h-5 text-foreground" />
                    Friends
                </CardTitle>
                <CardDescription>
                    {friends.length} friend{friends.length !== 1 ? 's' : ''}
                    {friendRequests.length > 0 && ` • ${friendRequests.length} pending request${friendRequests.length !== 1 ? 's' : ''}`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Friend Requests Section */}
                {friendRequests.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Friend Requests
                        </h3>
                        <div className="space-y-2">
                            {friendRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="p-3 rounded-lg bg-card/80 dark:bg-ai-mediator/20 border border-border/30 dark:border-transparent flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={request.avatar_url || undefined} />
                                            <AvatarFallback>{(request.display_name || request.full_name || '?').slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-medium text-foreground">
                                            {request.display_name || request.full_name || 'Unknown'}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => handleAcceptRequest(request.id, request.user_id)}
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRejectRequest(request.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Separator className="my-4" />
                    </div>
                )}

                {/* Friends List Section */}
                {friends.length === 0 && friendRequests.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground space-y-2">
                        <p>You haven't added any friends yet.</p>
                        <p className="text-sm">Chat with someone and click the "Add Friend" button to send them a request.</p>
                    </div>
                ) : friends.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No friends yet. Accept a request above!</p>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-sm font-semibold mb-3">Your Friends</h3>
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
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => handleStartChat(friend.friend_user_id)}
                                        >
                                            <MessageSquarePlus className="w-4 h-4 mr-2" />
                                            Chat
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleUnfriend(friend.id, friend.friend_user_id, friend.display_name || friend.full_name || 'this person')}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

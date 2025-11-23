import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MessageSquare, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  invite_code: string;
  created_at: string;
  message_count?: number;
  other_participant?: string;
}



const ITEMS_PER_PAGE = 10;

export const ConversationList = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    fetchConversations();
  }, [userId]);

  const fetchConversations = async () => {
    try {
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (participantsError) throw participantsError;

      if (participants && participants.length > 0) {
        const conversationIds = participants.map(p => p.conversation_id);

        const { data: convs, error: convsError } = await supabase
          .from('conversations')
          .select('*')
          .in('id', conversationIds)
          .order('created_at', { ascending: false });

        if (convsError) throw convsError;

        // Fetch message counts and other participants for each conversation
        const enrichedConvs = await Promise.all(
          (convs || []).map(async (conv) => {
            // Get message count
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id);

            // Get other participant's name
            const { data: otherParticipants, error: rpcError } = await supabase
              .rpc('get_conversation_participants', { conversation_uuid: conv.id });

            if (rpcError) {
              console.error('Error fetching participants for conv', conv.id, rpcError);
            }

            const otherPerson = otherParticipants?.find((p: any) => p.user_id !== userId);
            let displayName = 'Unknown';

            if (otherPerson) {
              // Try to fetch profile directly to get the latest display_name
              const { data: profileData } = await supabase
                .from('profiles')
                .select('display_name, full_name')
                .eq('id', otherPerson.user_id)
                .single();

              if (profileData) {
                if (profileData.display_name && profileData.display_name.trim().length > 0) {
                  displayName = profileData.display_name.trim();
                } else if (profileData.full_name && profileData.full_name.trim().length > 0) {
                  displayName = profileData.full_name.trim();
                }
              } else {
                // Fallback to RPC data if direct fetch fails (e.g. RLS)
                if (otherPerson.display_name && otherPerson.display_name.trim().length > 0) {
                  displayName = otherPerson.display_name.trim();
                } else if (otherPerson.full_name && otherPerson.full_name.trim().length > 0) {
                  displayName = otherPerson.full_name.trim();
                } else if (otherPerson.email) {
                  displayName = otherPerson.email;
                }
              }
            }

            return {
              ...conv,
              message_count: count || 0,
              other_participant: displayName,
            };
          })
        );

        setConversations(enrichedConvs);
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      toast.success('Session deleted');
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast.error(error.message || 'Failed to delete session');
    }
  };

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveTitle = async (conversationId: string) => {
    if (!editTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: editTitle.trim() })
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, title: editTitle.trim() } : c)
      );
      setEditingId(null);
      toast.success('Title updated');
    } catch (error: any) {
      console.error('Error updating title:', error);
      toast.error(error.message || 'Failed to update title');
    }
  };

  const totalPages = Math.ceil(conversations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedConversations = conversations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (loading) {
    return (
      <Card className="border-border/30 dark:border-ai-mediator/10 shadow-sm">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading sessions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/30 dark:border-ai-mediator/10 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MessageSquare className="w-5 h-5 text-foreground" />
          Your sessions
        </CardTitle>
        <CardDescription>
          {conversations.length} active Session{conversations.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sessions yet. Create or join one to get started!
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => !editingId && navigate(`/chat/${conversation.id}`)}
                  className="p-4 rounded-lg bg-card/80 dark:bg-ai-mediator/20 border border-border/30 dark:border-transparent hover:bg-ai-mediator/10 dark:hover:bg-ai-mediator/30 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {editingId === conversation.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveTitle(conversation.id)}
                          >
                            <Check className="w-4 h-4 text-accent" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="font-semibold text-foreground truncate flex items-center gap-2">
                          {conversation.title}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(conversation);
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </h3>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span>With: <span className="text-foreground font-medium">{conversation.other_participant}</span></span>
                        <span>•</span>
                        <span>{conversation.message_count} message{conversation.message_count !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span className="font-mono text-foreground">{conversation.invite_code}</span>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

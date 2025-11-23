import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

interface CreateConversationDialogProps {
    user: User | null;
}

export function CreateConversationDialog({ user }: CreateConversationDialogProps) {
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    const generateInviteCode = () => {
        return Math.random().toString(36).substring(2, 7).toUpperCase();
    };

    const handleCreateConversation = async () => {
        if (!user) return;

        try {
            setCreating(true);
            const code = generateInviteCode();

            const { data: conversation, error: convError } = await supabase
                .from('conversations')
                .insert({
                    invite_code: code,
                    title: 'New ElderFives'
                })
                .select()
                .single();

            if (convError) throw convError;

            const { error: participantError } = await supabase
                .from('conversation_participants')
                .insert({
                    conversation_id: conversation.id,
                    user_id: user.id
                });

            if (participantError) throw participantError;

            toast.success(`ElderFives created! Invite code: ${code}`);
            setOpen(false);
            navigate(`/chat/${conversation.id}`);
        } catch (error: any) {
            console.error('Error creating conversation:', error);
            toast.error(error.message || 'Failed to create ElderFives');
        } finally {
            setCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New ElderFives</DialogTitle>
                    <DialogDescription>
                        Start a new mediated conversation. You'll get an invite code to share.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end pt-4">
                    <Button onClick={handleCreateConversation} disabled={creating}>
                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {creating ? 'Creating...' : 'Create Conversation'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

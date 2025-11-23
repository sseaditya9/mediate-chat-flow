import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

interface JoinConversationDialogProps {
    user: User | null;
}

export function JoinConversationDialog({ user }: JoinConversationDialogProps) {
    const [open, setOpen] = useState(false);
    const [joining, setJoining] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const navigate = useNavigate();

    const handleJoinConversation = async () => {
        if (!user || !inviteCode.trim()) {
            toast.error('Please enter an invite code');
            return;
        }

        try {
            setJoining(true);

            const { data: conversation, error: findError } = await supabase
                .from('conversations')
                .select('id')
                .eq('invite_code', inviteCode.trim().toUpperCase())
                .single();

            if (findError || !conversation) {
                toast.error('Invalid invite code');
                return;
            }

            const { error: participantError } = await supabase
                .from('conversation_participants')
                .insert({
                    conversation_id: conversation.id,
                    user_id: user.id
                });

            if (participantError) {
                if (participantError.code === '23505') {
                    toast.info('You are already in this ElderFives');
                    setOpen(false);
                    navigate(`/chat/${conversation.id}`);
                    return;
                }
                throw participantError;
            }

            toast.success('Joined ElderFives successfully!');
            setOpen(false);
            navigate(`/chat/${conversation.id}`);
        } catch (error: any) {
            console.error('Error joining conversation:', error);
            toast.error(error.message || 'Failed to join ElderFives');
        } finally {
            setJoining(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Join</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Join ElderFives</DialogTitle>
                    <DialogDescription>
                        Enter the invite code to join an existing conversation.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <Input
                        placeholder="Enter invite code (e.g. X7Y2Z)"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        maxLength={8}
                    />
                    <div className="flex justify-end">
                        <Button onClick={handleJoinConversation} disabled={joining || !inviteCode.trim()}>
                            {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {joining ? 'Joining...' : 'Join Conversation'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

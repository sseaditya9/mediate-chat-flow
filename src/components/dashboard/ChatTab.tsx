import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, UserPlus } from "lucide-react";
import { ConversationList } from "./ConversationList";

interface ChatTabProps {
  user: User | null;
  inviteCode: string;
  setInviteCode: (code: string) => void;
  creating: boolean;
  joining: boolean;
  onCreateConversation: () => void;
  onJoinConversation: () => void;
}

export const ChatTab = ({
  user,
  inviteCode,
  setInviteCode,
  creating,
  joining,
  onCreateConversation,
  onJoinConversation,
}: ChatTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-accent/20 hover:border-accent/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Plus className="w-5 h-5 text-foreground" />
              Create eldersfive
            </CardTitle>
            <CardDescription>Start a new conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={onCreateConversation}
              disabled={creating}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {creating ? 'Creating...' : 'Create New eldersfive'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-accent/20 hover:border-accent/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <UserPlus className="w-5 h-5 text-foreground" />
              Join eldersfive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="bg-input border-border"
            />
            <Button
              onClick={onJoinConversation}
              disabled={joining || !inviteCode.trim()}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {joining ? 'Joining...' : 'Join eldersfive'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {user && <ConversationList userId={user.id} />}
    </div>
  );
};

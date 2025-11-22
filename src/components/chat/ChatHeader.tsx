import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Participant {
    user_id: string;
    full_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
    email: string;
}

interface WinOMeterData {
    left: { name: string; score: number };
    right: { name: string; score: number };
}

interface ChatHeaderProps {
    title: string;
    participants: Participant[];
    onBack: () => void;
    winOMeter: WinOMeterData | null;
}

const ChatHeader = ({ title, participants, onBack, winOMeter }: ChatHeaderProps) => {
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getDisplayName = (p: Participant) => {
        return p.display_name || p.full_name || p.email || "User";
    };

    return (
        <div className="bg-card border-b border-border shadow-sm z-10">
            {/* Top Bar: Nav & Title */}
            <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        onClick={onBack}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-muted text-muted-foreground"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>

                    <div>
                        <h1 className="text-base font-semibold text-foreground leading-tight">
                            {title}
                        </h1>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{participants.length} participants</span>
                        </div>
                    </div>
                </div>

                {/* Participants Avatars (Right side) */}
                <div className="flex -space-x-2 overflow-hidden">
                    {participants.slice(0, 4).map((p) => (
                        <Avatar key={p.user_id} className="inline-block h-8 w-8 border-2 border-background ring-1 ring-border">
                            <AvatarImage src={p.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                                {getInitials(getDisplayName(p))}
                            </AvatarFallback>
                        </Avatar>
                    ))}
                    {participants.length > 4 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">
                            +{participants.length - 4}
                        </div>
                    )}
                </div>
            </div>

            {/* Win-O-Meter Section */}
            {winOMeter && (
                <div className="px-6 pb-4 pt-1">
                    <div className="flex items-center justify-between text-xs font-medium mb-1.5 px-1">
                        <span className="text-primary">{winOMeter.left.name}</span>
                        <span className="text-muted-foreground font-bold tracking-wider text-[10px] uppercase">Win-O-Meter</span>
                        <span className="text-accent">{winOMeter.right.name}</span>
                    </div>

                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex shadow-inner relative">
                        {/* Left Bar */}
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out flex items-center justify-start px-2"
                            style={{ width: `${winOMeter.left.score}%` }}
                        >
                            {winOMeter.left.score > 15 && (
                                <span className="text-[9px] text-primary-foreground font-bold">{winOMeter.left.score}%</span>
                            )}
                        </div>

                        {/* Right Bar */}
                        <div
                            className="h-full bg-accent transition-all duration-500 ease-out flex items-center justify-end px-2"
                            style={{ width: `${winOMeter.right.score}%` }}
                        >
                            {winOMeter.right.score > 15 && (
                                <span className="text-[9px] text-accent-foreground font-bold">{winOMeter.right.score}%</span>
                            )}
                        </div>

                        {/* Center Marker (Optional visual flair) */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-background/50 transform -translate-x-1/2" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatHeader;

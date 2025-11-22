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
    currentUser: { id: string; display_name?: string | null; full_name?: string | null; email?: string } | null;
    inviteCode: string;
}

const ChatHeader = ({ title, participants, onBack, winOMeter, currentUser, inviteCode }: ChatHeaderProps) => {
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getDisplayName = (p: { display_name?: string | null; full_name?: string | null; email?: string } | null) => {
        if (!p) return "User";
        return p.display_name || p.full_name || p.email || "User";
    };

    // Determine relative Win-O-Meter positions
    // Goal: Right side = ME, Left side = OTHER
    let leftSide = winOMeter?.left;
    let rightSide = winOMeter?.right;

    if (winOMeter && winOMeter.left && winOMeter.right && currentUser) {
        // Helper to find participant by name (fuzzy match)
        const findParticipantByName = (name: string) => {
            const cleanName = name.toLowerCase().trim();
            return participants.find(p => {
                const dName = (p.display_name || "").toLowerCase().trim();
                const fName = (p.full_name || "").toLowerCase().trim();
                return dName.includes(cleanName) || cleanName.includes(dName) ||
                    fName.includes(cleanName) || cleanName.includes(fName);
            });
        };

        const leftParticipant = findParticipantByName(winOMeter.left.name);
        const rightParticipant = findParticipantByName(winOMeter.right.name);

        // Logic:
        // 1. If Left Participant is Me -> Swap
        // 2. If Right Participant is Me -> No Swap
        // 3. Fallback to name matching if participant lookup fails

        let shouldSwap = false;

        if (leftParticipant && leftParticipant.user_id === currentUser.id) {
            shouldSwap = true;
        } else if (rightParticipant && rightParticipant.user_id === currentUser.id) {
            shouldSwap = false;
        } else {
            // Fallback to direct name matching against current user
            const currentName = getDisplayName(currentUser).toLowerCase().trim();
            const leftName = winOMeter.left.name.toLowerCase().trim();
            const rightName = winOMeter.right.name.toLowerCase().trim();

            const leftMatchesMe = leftName.includes(currentName) || currentName.includes(leftName);
            const rightMatchesMe = currentName.includes(rightName) || rightName.includes(currentName); // Added this line for completeness

            if (leftMatchesMe && !rightMatchesMe) {
                shouldSwap = true;
            }
        }

        if (shouldSwap) {
            leftSide = winOMeter.right;
            rightSide = winOMeter.left;
        }
    }

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
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-semibold text-foreground leading-tight">
                                {title}
                            </h1>
                            {inviteCode && (
                                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                    #{inviteCode}
                                </span>
                            )}
                        </div>
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
            {winOMeter && leftSide && rightSide && (
                <div className="px-6 pb-4 pt-1">
                    <div className="flex items-center justify-between text-xs font-medium mb-1.5 px-1">
                        <span className="text-muted-foreground">{leftSide.name}</span>
                        <span className="text-muted-foreground font-bold tracking-wider text-[10px] uppercase">Win-O-Meter</span>
                        <span className="text-primary font-semibold">{rightSide.name} (You)</span>
                    </div>

                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex shadow-inner relative">
                        {/* Left Bar (Other Person - Gray/Muted or Secondary Color) */}
                        <div
                            className="h-full bg-slate-400 transition-all duration-500 ease-out flex items-center justify-start px-2"
                            style={{ width: `${leftSide.score}%` }}
                        >
                            {leftSide.score > 15 && (
                                <span className="text-[9px] text-white font-bold">{leftSide.score}%</span>
                            )}
                        </div>

                        {/* Right Bar (Me - Primary Color) */}
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out flex items-center justify-end px-2"
                            style={{ width: `${rightSide.score}%` }}
                        >
                            {rightSide.score > 15 && (
                                <span className="text-[9px] text-primary-foreground font-bold">{rightSide.score}%</span>
                            )}
                        </div>

                        {/* Center Marker */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-background/50 transform -translate-x-1/2" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatHeader;

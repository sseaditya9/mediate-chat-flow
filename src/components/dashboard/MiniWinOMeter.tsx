import { Progress } from "@/components/ui/progress";

interface WinMeterData {
    left: { name: string; score: number };
    right: { name: string; score: number };
}

interface MiniWinOMeterProps {
    data: WinMeterData;
}

export const MiniWinOMeter = ({ data }: MiniWinOMeterProps) => {
    if (!data || !data.left || !data.right) return null;

    // Calculate percentage for left side (assuming total is 100 or sum of scores)
    const total = data.left.score + data.right.score;
    const leftPercent = total > 0 ? (data.left.score / total) * 100 : 50;

    return (
        <div className="w-full mt-3 space-y-1">
            <div className="flex justify-between text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                <span className="truncate max-w-[45%]">{data.left.name}</span>
                <span className="truncate max-w-[45%] text-right">{data.right.name}</span>
            </div>
            <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden flex">
                <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${leftPercent}%` }}
                />
                <div
                    className="h-full bg-destructive transition-all duration-500"
                    style={{ width: `${100 - leftPercent}%` }}
                />
            </div>
        </div>
    );
};

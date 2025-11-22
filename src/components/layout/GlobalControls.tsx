import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/UserNav";

export function GlobalControls() {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 p-2 bg-background/80 backdrop-blur-sm rounded-full border border-border shadow-lg">
            <ModeToggle />
            <UserNav />
        </div>
    );
}

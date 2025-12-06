import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const HowTo = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background p-8 flex flex-col items-center">
            <div className="w-full max-w-3xl space-y-8">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </div>

                <div className="space-y-6 text-foreground">
                    <h1 className="text-5xl font-serif tracking-tight">How to Use EldersFive</h1>

                    <div className="prose dark:prose-invert max-w-none space-y-6 text-lg leading-relaxed text-muted-foreground">
                        <p className="text-foreground font-semibold">Two ways to start a debate:</p>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">Option 1: Share Code (Quick Start)</h2>
                            <ol className="space-y-2 list-decimal list-inside">
                                <li>Create a new conversation. You get a <span className="font-bold text-foreground">5-character code</span>.</li>
                                <li>Send the code to your opponent. They paste it in and join instantly.</li>
                                <li>Start arguing. The EldersFive score every exchange.</li>
                                <li>Win-O-Meter tracks who's ahead in real-time.</li>
                            </ol>
                            <p className="text-sm italic">Good for: One-off debates, settling arguments quickly, debating with strangers.</p>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">Option 2: Friend System (Regular Opponents)</h2>
                            <ol className="space-y-2 list-decimal list-inside">
                                <li>During any conversation, click "Add Friend" on your opponent.</li>
                                <li>They accept your request from their dashboard.</li>
                                <li>Now you can start direct chats with them anytime—no codes needed.</li>
                                <li>Build your roster of worthy opponents.</li>
                            </ol>
                            <p className="text-sm italic">Good for: Regular debates, friendly rivals, building a debate circle.</p>
                        </div>

                        <div className="pt-4 border-t border-border/50 space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">How the EldersFive Judge</h2>
                            <ul className="space-y-2 list-disc list-inside">
                                <li><strong>Debates about ideas:</strong> They score logic, evidence, and reasoning. They'll push both sides to argue better, not end the debate.</li>
                                <li><strong>Personal conflicts:</strong> They'll cut through the BS, assign fault, and suggest resolution.</li>
                                <li><strong>Win-O-Meter:</strong> Starts at 50-50. Shifts based on who's making stronger arguments. It's cumulative—whole debate matters, not just the last punch.</li>
                            </ul>
                        </div>

                        <div className="pt-4 border-t border-border/50">
                            <p className="font-semibold text-foreground">That's it.</p>
                            <p className="text-foreground">Pick your opponent. Make your case. Let the Elders judge.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowTo;

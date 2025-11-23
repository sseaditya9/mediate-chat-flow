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

                    <div className="prose dark:prose-invert max-w-none space-y-4 text-lg leading-relaxed text-muted-foreground">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-foreground">1. Start a Session</h2>
                            <p>
                                Open the app and create a new session. You'll get a unique <span className="font-bold text-foreground">5-character code</span>.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-foreground">2. Bring in the Other Half of the Drama</h2>
                            <p>
                                Share the code with the person you're arguing with. They join instantly.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-foreground">3. Start Talking</h2>
                            <p>
                                Both of you chat normally. EldersFive reads each message, rolls its metaphorical eyes, and responds after every turn.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-foreground">4. Watch the Win-O-Meter Dance</h2>
                            <p>
                                With every AI response, the score shifts as the Elders figure out who's making sense — and who's just making noise.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-foreground">5. Get the Final Judgement</h2>
                            <p>
                                Once the Elders understand the issue, they drop a short, sharp, fair verdict along with a couple of actions to fix it.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-border/50">
                            <p className="font-semibold text-foreground">That's it.</p>
                            <p className="text-foreground">Fast. Fun. Drama-proof.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowTo;

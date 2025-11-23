import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const HowTo = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-start pt-12">
            <div className="w-full max-w-3xl space-y-8">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => navigate("/dashboard")}
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                </div>

                <div className="space-y-6">
                    <h1 className="text-5xl font-serif tracking-tight text-foreground">How to Use EldersFive</h1>

                    <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
                        <div className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">1. Start a Session</h2>
                            <p>
                                Open the app and create a new session. You'll get a unique <span className="font-bold text-foreground">5-character code</span>.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">2. Bring in the Other Half of the Drama</h2>
                            <p>
                                Share the code with the person you're arguing with. They join instantly.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">3. Start Talking</h2>
                            <p>
                                Both of you chat normally. EldersFive reads each message, rolls its metaphorical eyes, and responds after every turn.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">4. Watch the Win-O-Meter Dance</h2>
                            <p>
                                With every AI response, the score shifts as the Elders figure out who's making sense — and who's just making noise.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">5. Get the Final Judgement</h2>
                            <p>
                                Once the Elders understand the issue, they drop a short, sharp, fair verdict along with a couple of actions to fix it.
                            </p>
                        </div>

                        <div className="pt-4 space-y-2 border-t border-border/50">
                            <p className="text-xl font-semibold text-foreground">That's it.</p>
                            <p className="text-xl text-foreground">Fast. Fun. Drama-proof.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowTo;

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const About = () => {
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
                    <h1 className="text-5xl font-serif tracking-tight">About The Five Elders</h1>

                    <div className="prose dark:prose-invert max-w-none space-y-4 text-lg leading-relaxed text-muted-foreground">
                        <p>
                            <span className="font-semibold text-foreground">The Five Elders</span> is an AI-mediated dispute resolution platform designed to bring clarity and fairness to conflicts.
                        </p>
                        <p>
                            Inspired by the wisdom of ancient councils, our system employs advanced AI agents to act as impartial mediators. Whether it's a disagreement between friends, a workplace dispute, or a complex negotiation, The Five Elders provides a structured environment for dialogue.
                        </p>
                        <p>
                            Our "Win-O-Meter" technology analyzes conversation dynamics in real-time, offering objective feedback on who is "winning" based on logic, empathy, and constructive engagement—not just rhetoric.
                        </p>
                        <p>
                            Let the wise decide.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;

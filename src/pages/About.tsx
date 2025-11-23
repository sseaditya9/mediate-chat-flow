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
                    <h1 className="text-5xl font-serif tracking-tight">About The Elders Five</h1>

                    <div className="prose dark:prose-invert max-w-none space-y-4 text-lg leading-relaxed text-muted-foreground">
                        <p>
                            <span className="font-semibold text-foreground">The EldersFive</span> is based on the legendary tradition of five wise elders who used to settle conflicts, big and small whenever two people disagreed, felt stuck, and needed an impartial authority to step in and help them see things clearly. They didn’t need degrees or long speeches, just authority, attitude, and a sharp sense of humor. So we stole that vibe.
                        </p>
                        <p>
                            Two people drop their dispute.
                            The Elders listens,  ask the right questions, and deliver a verdict that actually makes sense.
                            Fast. Fair. A little too honest.
                        </p>
                        <p>
                            No therapy talk.
                            No corporate jargon.
                            Just modern problems solved with ancient confidence.
                        </p>
                        <p>
                            We even added the Win-O-Meter™, because let’s be honest: half the fun of solving a conflict is knowing who actually had the point and who was just loud. It’s petty, it’s honest, and it keeps everyone humble.
                        </p>
                        <p>
                            Because your tiny arguments deserve legendary resolutions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;

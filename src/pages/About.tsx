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
                    <h1 className="text-5xl font-serif tracking-tight">About EldersFive</h1>

                    <div className="prose dark:prose-invert max-w-none space-y-4 text-lg leading-relaxed text-muted-foreground">
                        <p>
                            <span className="font-semibold text-foreground">EldersFive is based on the ancient tradition</span> of having a set of five wise and learned elders to solve a debate about ideas, grievances, or an impasse between two parties.
                        </p>
                        <p>
                            In EldersFive, we give the authority of the five elders to the LLMs, and we place our trust in them to judge our ideas and debates with an objective impartiality, no fluffy soft talk, just pure honesty and a strong personality. It will call out the wrong idea, and reward the right one with a Win-O-Meter.
                        </p>
                        <p>
                            The EldersFive use the Win-O-Meter to convey who is the winning party of the clash, and by how much, starting from a 50-50.
                        </p>
                        <p className="text-sm italic border-l-4 border-primary/50 pl-4 py-2">
                            <strong>Privacy:</strong> Note that your conversations are AES encrypted.
                        </p>
                        <p className="text-sm mt-6 pt-4 border-t border-border">
                            <strong>Contact us:</strong>{" "}
                            <a
                                href="mailto:aditya9@alumni.iitm.ac.in"
                                className="text-primary hover:underline transition-colors"
                            >
                                aditya9@alumni.iitm.ac.in
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;

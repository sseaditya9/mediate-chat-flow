import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/dashboard`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-6xl">

          {/* Mobile: Title at top */}
          <div className="flex md:hidden items-center gap-5 justify-center mb-10">
            <img
              src="/darkfav.ico"
              alt="EldersFive"
              className="w-16 h-16 dark:hidden"
            />
            <img
              src="/lightfav.ico"
              alt="EldersFive"
              className="w-16 h-16 hidden dark:block"
            />
            <h1 className="text-5xl tracking-tight text-foreground font-serif">
              EldersFive
            </h1>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-2 gap-16 items-center">
            {/* Left: Concept & Branding (Desktop only shows title here) */}
            <div className="space-y-8 order-2 md:order-1">
              {/* Desktop: Title */}
              <div className="hidden md:flex items-center gap-6">
                <img
                  src="/darkfav.ico"
                  alt="EldersFive"
                  className="w-20 h-20 dark:hidden"
                />
                <img
                  src="/lightfav.ico"
                  alt="EldersFive"
                  className="w-20 h-20 hidden dark:block"
                />
                <h1 className="text-7xl tracking-tight text-foreground font-serif">
                  EldersFive
                </h1>
              </div>

              {/* Text content (shows on both mobile and desktop) */}
              <div className="space-y-6 text-muted-foreground">
                <p className="text-lg leading-relaxed">
                  Based on the ancient tradition of having a set of five wise and learned elders to solve a debate about ideas, grievances, or an impasse between two parties.
                </p>

                <p className="text-lg leading-relaxed">
                  We give the authority of the five elders to the LLMs. No fluffy soft talk, just <span className="font-semibold text-foreground">pure honesty and a strong personality</span>. The EldersFive will judge the wrong idea and reward the right one.
                </p>

                <div className="flex items-start gap-4 bg-primary/10 border border-primary/20 rounded-xl p-5 shadow-sm">
                  <div className="flex-shrink-0 w-2.5 h-2.5 mt-2 rounded-full bg-primary shadow-sm"></div>
                  <div>
                    <p className="font-semibold text-foreground">Win-O-Meter</p>
                    <p className="text-sm">Tracks who's winning the clash, starting from 50-50. Watch the score shift as the debate unfolds.</p>
                  </div>
                </div>

                <p className="text-sm italic border-l-4 border-muted pl-5 py-3">
                  Your conversations are AES encrypted.
                </p>
              </div>
            </div>

            {/* Right: Sign In */}
            <div className="flex items-center justify-center order-1 md:order-2 w-full">
              <div className="w-full max-w-md space-y-6 bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-10 shadow-2xl">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-semibold text-foreground">Enter the Arena</h2>
                </div>

                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {loading ? 'Signing in...' : 'Sign in with Google'}
                </Button>

                <p className="text-xs text-center text-muted-foreground leading-relaxed px-2">
                  By signing in, you agree to let the EldersFive judge your debates with brutal honesty
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
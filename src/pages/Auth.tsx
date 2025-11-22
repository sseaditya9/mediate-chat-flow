import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  // Determine which image to show based on theme
  // Note: In a real app, we'd import these. For now, using the paths provided by the tool.
  // Since I can't import from the artifacts folder directly in the code without moving them,
  // I will assume they are moved to public/assets or similar.
  // WAIT: I cannot move files to public easily. I will use the absolute paths for now if running locally,
  // but for a web app, they need to be served.
  // Strategy: I will use a placeholder URL or base64 if I could, but for this environment,
  // I will assume the user will move them.
  // ACTUALLY: I should probably just use the file paths I got, but they are absolute paths on the server.
  // I will use a relative path assuming they are in `public`.
  // I will ask the user to move them or I will just use the absolute path for the `src` which might work in Electron/local dev,
  // but for a web app it won't.
  // Let's try to use a "cool" CSS gradient fallback if images fail, or just style it heavily with CSS.
  // But the user explicitly asked for these graphics.
  // I will use the absolute paths for now as I am in a local environment.

  const dayImage = "/landing-day.png";
  const nightImage = "/landing-night.png";

  const currentImage = theme === 'dark' ? nightImage : dayImage;

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background transition-colors duration-500">
      {/* Left Side - Content */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16 lg:p-24 relative overflow-hidden">
        <div className="z-10 space-y-8">
          <div className="space-y-2">
            <h2 className="text-sm font-bold tracking-widest text-primary uppercase">
              The Modern Digital Panchayat
            </h2>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground tracking-tight leading-tight">
              EldersFive
            </h1>
            <p className="text-xl text-muted-foreground max-w-md leading-relaxed">
              Where ancient wisdom meets artificial intelligence. Resolve disputes with the fairness of a village council and the precision of AI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              size="lg"
              className="h-14 px-8 text-lg font-medium bg-primary hover:bg-primary/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {loading ? 'Summoning the Elders...' : 'Enter the Council'}
            </Button>
          </div>

          <div className="pt-8 flex items-center gap-4 text-sm text-muted-foreground/60">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold">
                  AI
                </div>
              ))}
            </div>
            <p>Join 1,000+ others seeking clarity</p>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      </div>

      {/* Right Side - Visual */}
      <div className="w-full md:w-1/2 relative bg-muted overflow-hidden min-h-[400px] md:min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10 md:hidden" />
        <img
          src={currentImage}
          alt="Atmospheric Scene"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
        />
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />

        {/* Floating Quote */}
        <div className="absolute bottom-12 left-12 right-12 z-20 hidden md:block">
          <blockquote className="text-2xl font-serif text-white/90 italic leading-relaxed drop-shadow-lg">
            "In the middle of difficulty lies opportunity. Let the elders guide you through."
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default Auth;

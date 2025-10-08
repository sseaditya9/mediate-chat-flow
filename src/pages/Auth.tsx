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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Mediate
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              AI-powered conversations that bring people together
            </p>
          </div>
        </div>

        <div className="mt-10">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Start meaningful conversations with AI mediation
        </p>
      </div>
    </div>
  );
};

export default Auth;
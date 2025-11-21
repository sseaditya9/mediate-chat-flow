import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, UserCircle, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AccountTabProps {
  user: User | null;
}

export const AccountTab = ({ user }: AccountTabProps) => {
  const [fullName, setFullName] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, display_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setFullName(data?.full_name || "");
      setDisplayName(data?.display_name || data?.full_name || "");
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Display name updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update display name');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Loading profile...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {(displayName || user?.email)?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="full-name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="full-name"
                value={fullName}
                disabled
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                Your full name cannot be changed here
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-name" className="text-sm font-medium flex items-center gap-2">
                <Edit2 className="w-3 h-3" />
                Display Name
              </Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={fullName || "Enter your display name"}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                This name will be shown to other users in conversations
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !displayName.trim()}
              className="w-full"
            >
              {saving ? "Saving..." : "Save Display Name"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


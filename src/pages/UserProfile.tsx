import { useState, useEffect } from 'react';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getDisplayError } from '@/utils/errorHandler';
import { ArrowLeft, Loader2, User, Mail, Shield, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { z } from 'zod';

const profileSchema = z.object({
  fullName: z.string().trim().max(100, { message: "Name must be less than 100 characters" }),
});

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

export default function UserProfile() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigateOnce();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<{ fullName?: string }>({});

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
    }
  }, [authLoading, user]);

  const fetchProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } else if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    // Validate input
    const validation = profileSchema.safeParse({ fullName });
    if (!validation.success) {
      const fieldErrors: { fullName?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'fullName') {
          fieldErrors.fullName = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', { description: getDisplayError(error) });
    } else {
      toast.success('Profile updated successfully');
      setProfile(prev => prev ? { ...prev, full_name: fullName.trim() } : prev);
    }

    setIsSaving(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6" />
              My Profile
            </h1>
            <p className="text-muted-foreground">Manage your account settings</p>
          </div>
        </div>

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSaving}
                maxLength={100}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName}</p>
              )}
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Account Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Information about your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Role</span>
              </div>
              <Badge variant={isAdmin ? 'default' : 'secondary'}>
                {isAdmin ? 'Admin' : 'User'}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Member Since</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {profile?.created_at
                  ? format(new Date(profile.created_at), 'MMMM d, yyyy')
                  : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

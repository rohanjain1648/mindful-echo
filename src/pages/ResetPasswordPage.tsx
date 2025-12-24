import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Brain, Loader2, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';

const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(72);

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [hasSession, setHasSession] = useState(false);
  const [checking, setChecking] = useState(true);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user arrived via password reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      }
      setChecking(false);
    };
    
    checkSession();

    // Listen for auth state changes (password recovery event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Password reset failed",
          description: error.message,
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Password updated!",
          description: "Your password has been successfully reset.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-calm p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <Card className="w-full max-w-md shadow-card border-border/50">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center shadow-glow">
                <Brain className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-display">Invalid Link</CardTitle>
              <CardDescription className="mt-2">
                This password reset link is invalid or has expired.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <Button onClick={() => navigate('/forgot-password')} className="w-full">
              Request New Reset Link
            </Button>
            <div className="mt-4 text-center">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-calm p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <Card className="w-full max-w-md shadow-card border-border/50">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center shadow-glow">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-display">Password Reset!</CardTitle>
              <CardDescription className="mt-2">
                Your password has been successfully updated.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Continue to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-calm p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md shadow-card border-border/50">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center shadow-glow">
              <Brain className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-display">Set New Password</CardTitle>
            <CardDescription className="mt-2">
              Enter your new password below
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

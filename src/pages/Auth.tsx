import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UtensilsCrossed } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('student');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success('Welcome back!');
      } else {
        await signUp(email, password, fullName, selectedRole);
        toast.success('Account created! You can now log in.');
      }
      navigate('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roles: { value: AppRole; label: string; emoji: string }[] = [
    { value: 'student', label: 'Student', emoji: '🎓' },
    { value: 'chef', label: 'Chef', emoji: '👨‍🍳' },
    { value: 'admin', label: 'Admin', emoji: '🛡️' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass shadow-warm animate-slide-up">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-warm">
            <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display">
            {isLogin ? 'Welcome Back' : 'Join Smart Canteen'}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label>I am a...</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {roles.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSelectedRole(r.value)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          selectedRole === r.value
                            ? 'border-primary bg-primary/10 shadow-warm'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl block">{r.emoji}</span>
                        <span className="text-xs font-medium mt-1 block">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

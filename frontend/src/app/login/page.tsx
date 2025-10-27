"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrainCircuit } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="flex flex-col items-center gap-2">
          <BrainCircuit className="h-10 w-10 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            Sign in to Money Intelligence
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border rounded-lg p-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </span>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
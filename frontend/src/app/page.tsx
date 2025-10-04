"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrainCircuit, TrendingUp, Shield, Sparkles } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <BrainCircuit className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Money Intelligence
            </h1>
          </div>

          {/* Description */}
          <p className="text-xl text-muted-foreground max-w-2xl">
            Track your finances with intelligence. Simple, powerful, and designed for clarity.
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <div className="flex flex-col items-center gap-2 p-4">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-foreground">Track Growth</h3>
              <p className="text-sm text-muted-foreground">Monitor your financial progress</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <Shield className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-foreground">Secure</h3>
              <p className="text-sm text-muted-foreground">Your data is protected</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <Sparkles className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-foreground">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">Smart insights and analysis</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button asChild size="lg">
              <Link href="/register">
                Get Started
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Your personal finance tracking application
        </div>
      </footer>
    </div>
  );
}

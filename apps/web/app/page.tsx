"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Hero from "@/components/hero-section";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/challenges");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 overflow-y-clip">
      <Hero />

      {/* <div className="w-full py-5 bg-brand-green-light"></div>
      <div className="w-full py-5 bg-brand-green-dark"></div>
      <div className="w-full py-5 bg-brand-green-darker"></div> */}
    </div>
  );
}

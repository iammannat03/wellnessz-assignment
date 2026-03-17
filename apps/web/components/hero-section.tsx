"use client";

import Lottie, { LottieRefCurrentProps } from "lottie-react";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

type Props = {};

const Hero = (props: Props) => {
  const [data, setData] = useState<any>(null);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  useEffect(() => {
    fetch("/lottie/hero-bg-animation.json")
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Failed to load")),
      )
      .then(setData)
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    if (data && lottieRef.current) {
      lottieRef.current.setSpeed(0.5);
    }
  }, [data]);

  return (
    <section className="relative w-full h-[100vh] min-h-[640px]">
      {data && (
        <Lottie
          lottieRef={lottieRef}
          animationData={data}
          loop
          autoplay
          className="absolute top-0 left-100 h-full w-[200%] -z-10"
          style={{ width: "200%", height: "100%" }}
        />
      )}

      <div className="relative z-10 flex h-full items-center px-6 sm:px-10 lg:px-20">
        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>New</span>
            <span className="text-slate-400">
              Daily wellness challenges are live
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
              Build habits that
              <span className="block text-brand-green-darker">
                actually stick.
              </span>
            </h1>
            <p className="max-w-lg text-base sm:text-lg text-slate-600">
              Join science-backed wellness challenges, log your daily progress,
              and stay accountable with a community striving for better health.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Link
              href="/register"
              className={cn(
                buttonVariants(),
                "h-11 px-6 text-sm font-semibold shadow-md shadow-emerald-500/20",
              )}
            >
              Get started for free
            </Link>
            <Link
              href="/challenges"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 px-6 text-sm font-semibold border-slate-200 bg-white/80 backdrop-blur hover:bg-white",
              )}
            >
              Browse challenges
            </Link>
          </div>

          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full bg-emerald-100 border border-white" />
              <div className="h-8 w-8 rounded-full bg-emerald-200 border border-white" />
              <div className="h-8 w-8 rounded-full bg-emerald-300 border border-white" />
            </div>
            <p>
              <span className="font-semibold text-slate-700">Steps</span>
              {" • "}
              <span className="font-semibold text-slate-700">Meditation</span>
              {" • "}
              <span className="font-semibold text-slate-700">Water</span>
              {" - all in one place"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

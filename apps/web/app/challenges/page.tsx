"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ChallengeCard } from "@/components/challenge-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type {
  ChallengeSummary,
  Metric,
  ChallengeCreateRequest,
} from "@repo/contracts";
import { useRouter } from "next/navigation";

export default function ChallengesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [challenges, setChallenges] = useState<ChallengeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [metricFilter, setMetricFilter] = useState<string>("all");
  const [showActiveFilter, setShowActiveFilter] = useState<string>("true");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const getToday = () => new Date().toISOString().slice(0, 10);

  const [newChallenge, setNewChallenge] = useState<ChallengeCreateRequest>({
    title: "",
    description: "",
    metric: "steps",
    dailyTarget: 0,
    startDate: getToday(),
    endDate: getToday(),
    visibility: "public",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setIsLoading(true);
        const query: { metric?: Metric; active?: "true" | "false" } = {};
        if (metricFilter !== "all") query.metric = metricFilter as Metric;
        if (showActiveFilter !== "all")
          query.active = showActiveFilter as "true" | "false";

        const response = await api.challenges.list(query);
        setChallenges(response.items);
      } catch (err) {
        setError("Failed to load challenges");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchChallenges();
    }
  }, [isAuthenticated, metricFilter, showActiveFilter]);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await api.challenges.create(newChallenge);
      setChallenges((prev) => [response.challenge, ...prev]);
      setIsCreateOpen(false);
      setNewChallenge({
        title: "",
        description: "",
        metric: "steps",
        dailyTarget: 0,
        startDate: getToday(),
        endDate: getToday(),
        visibility: "public",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create challenge");
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Challenges</h1>
          <p className="text-muted-foreground">
            Browse and join wellness challenges
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button>Create Challenge</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Challenge</DialogTitle>
              <DialogDescription>
                Create a new wellness challenge for others to join
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newChallenge.title}
                  onChange={(e) =>
                    setNewChallenge({ ...newChallenge, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newChallenge.description}
                  onChange={(e) =>
                    setNewChallenge({
                      ...newChallenge,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metric">Metric</Label>
                  <Select
                    value={newChallenge.metric}
                    onValueChange={(value) =>
                      value &&
                      setNewChallenge({
                        ...newChallenge,
                        metric: value as Metric,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="steps">Steps</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyTarget">Daily Target</Label>
                  <Input
                    id="dailyTarget"
                    type="number"
                    min={1}
                    value={
                      newChallenge.dailyTarget === 0
                        ? ""
                        : newChallenge.dailyTarget
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      const parsed = raw === "" ? 0 : parseInt(raw, 10);
                      setNewChallenge({
                        ...newChallenge,
                        dailyTarget: isNaN(parsed) ? 0 : parsed,
                      });
                    }}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newChallenge.startDate}
                    onChange={(e) =>
                      setNewChallenge({
                        ...newChallenge,
                        startDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newChallenge.endDate}
                    onChange={(e) =>
                      setNewChallenge({
                        ...newChallenge,
                        endDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={newChallenge.visibility}
                  onValueChange={(value) =>
                    value &&
                    setNewChallenge({
                      ...newChallenge,
                      visibility: value as "public" | "private",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Challenge"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-8">
        <Select
          value={metricFilter}
          onValueChange={(v) => v && setMetricFilter(v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by metric">
              {metricFilter === "all"
                ? "All Metrics"
                : metricFilter === "steps"
                  ? "Steps"
                  : metricFilter === "minutes"
                    ? "Minutes"
                    : "Liters"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Metrics</SelectItem>
            <SelectItem value="steps">Steps</SelectItem>
            <SelectItem value="minutes">Minutes</SelectItem>
            <SelectItem value="liters">Liters</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={showActiveFilter}
          onValueChange={(v) => v && setShowActiveFilter(v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status">
              {showActiveFilter === "all"
                ? "All Challenges"
                : showActiveFilter === "true"
                  ? "Active"
                  : "Ended"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Challenges</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Ended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-64">
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      ) : challenges.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Challenges Found</CardTitle>
            <CardDescription>
              There are no challenges matching your filters. Try creating one or
              adjust your filters.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-muted-foreground text-sm">
              Create a new challenge to get started, or change the metric and
              status filters above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}
    </div>
  );
}

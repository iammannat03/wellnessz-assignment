"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Brain, Droplet, Footprints } from "lucide-react";
import type {
  ChallengeDetails,
  ChallengeUpdateRequest,
  LeaderboardEntry,
  Metric,
  MyLogsResponse,
  ProgressLogCreateRequest,
} from "@repo/contracts";

const metricIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  steps: Footprints,
  minutes: Brain,
  liters: Droplet,
};

const metricLabels: Record<string, string> = {
  steps: "Steps",
  minutes: "Minutes",
  liters: "Liters",
};

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myLogs, setMyLogs] = useState<MyLogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState<ChallengeUpdateRequest>({});

  const [logAmount, setLogAmount] = useState("");
  const [logDate, setLogDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !challengeId) return;

      try {
        setIsLoading(true);
        const [challengeRes, leaderboardRes] = await Promise.all([
          api.challenges.get(challengeId),
          api.challenges.getLeaderboard(challengeId, { nocache: true }),
        ]);
        setChallenge(challengeRes.challenge);
        setLeaderboard(leaderboardRes.items);

        if (challengeRes.challenge.isParticipant) {
          const logsRes = await api.challenges.getLogs(challengeId);
          setMyLogs(logsRes);
        }
      } catch (err) {
        setError("Failed to load challenge");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, challengeId]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await api.challenges.join(challengeId);
      const [challengeRes, logsRes, leaderboardRes] = await Promise.all([
        api.challenges.get(challengeId),
        api.challenges.getLogs(challengeId),
        api.challenges.getLeaderboard(challengeId, { nocache: true }),
      ]);
      setChallenge(challengeRes.challenge);
      setMyLogs(logsRes);
      setLeaderboard(leaderboardRes.items);
    } catch (err) {
      console.error(err);
      alert("Failed to join challenge");
    } finally {
      setIsJoining(false);
    }
  };

  const isCreator = !!challenge && user?.id === challenge.createdBy.id;

  const handleEditOpen = () => {
    if (!challenge) return;
    setEditForm({
      title: challenge.title,
      description: challenge.description ?? "",
      metric: challenge.metric,
      dailyTarget: challenge.dailyTarget,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      visibility: challenge.visibility,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editForm.title?.trim() ||
      !editForm.dailyTarget ||
      !editForm.startDate ||
      !editForm.endDate
    ) {
      toast.error("Please fill required fields");
      return;
    }
    setIsUpdating(true);
    try {
      await api.challenges.update(challengeId, editForm);
      const challengeRes = await api.challenges.get(challengeId);
      setChallenge(challengeRes.challenge);
      setIsEditOpen(false);
      toast.success("Challenge updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update challenge");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await api.challenges.delete(challengeId);
      toast.success("Challenge deleted");
      router.push("/challenges");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete challenge");
      setIsDeleting(false);
    }
  };

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(logAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setIsLogging(true);
    try {
      const data: ProgressLogCreateRequest = {
        amount,
        date: logDate,
      };
      const logsRes = await api.challenges.logProgress(challengeId, data);
      setMyLogs(logsRes);
      setLogAmount("");
      setLogDate(new Date().toISOString().split("T")[0]);

      // Refetch leaderboard with cache bypass so it reflects the new progress
      const leaderboardRes = await api.challenges.getLeaderboard(challengeId, {
        nocache: true,
      });
      setLeaderboard(leaderboardRes.items);

      toast.success("Progress logged!", {
        description: `${amount} ${metricLabels[challenge?.metric ?? "steps"]} for ${logDate}`,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to log progress");
    } finally {
      setIsLogging(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">{error || "Challenge not found"}</p>
            <Button
              variant="link"
              onClick={() => router.push("/challenges")}
              className="mt-4"
            >
              Back to challenges
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = new Date(challenge.endDate) >= new Date();

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/challenges")}
        className="mb-4"
      >
        ← Back to Challenges
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center text-4xl">
                    {(() => {
                      const Icon = metricIcons[challenge.metric] ?? Footprints;
                      return <Icon className="size-10" />;
                    })()}
                  </span>
                  <div>
                    <CardTitle className="text-2xl">
                      {challenge.title}
                    </CardTitle>
                    <CardDescription>
                      by {challenge.createdBy.name}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isCreator && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditOpen}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsDeleteOpen(true)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Active" : "Ended"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                {challenge.description || "No description provided"}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Metric</span>
                  <p className="font-medium">
                    {metricLabels[challenge.metric]}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Daily Target</span>
                  <p className="font-medium">
                    {challenge.dailyTarget.toLocaleString()}{" "}
                    {challenge.metric === "liters" ? "L" : ""}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Start Date</span>
                  <p className="font-medium">
                    {new Date(challenge.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">End Date</span>
                  <p className="font-medium">
                    {new Date(challenge.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Participants</span>
                  <p className="font-medium">{challenge.participantsCount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Visibility</span>
                  <p className="font-medium capitalize">
                    {challenge.visibility}
                  </p>
                </div>
              </div>

              {!challenge.isParticipant && isActive && (
                <Button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full mt-6"
                >
                  {isJoining ? "Joining..." : "Join Challenge"}
                </Button>
              )}
            </CardContent>
          </Card>

          {challenge.isParticipant && (
            <Card>
              <CardHeader>
                <CardTitle>Log Your Progress</CardTitle>
                <CardDescription>
                  Record your daily activity. Multiple logs for the same day add
                  up. Log ≥{challenge.dailyTarget.toLocaleString()}{" "}
                  {challenge.metric === "liters"
                    ? "L"
                    : challenge.metric === "steps"
                      ? "steps"
                      : "min"}{" "}
                  total to count as a successful day and increase your streak.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogProgress} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logDate">Date</Label>
                      <Input
                        id="logDate"
                        type="date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logAmount">
                        Amount ({metricLabels[challenge.metric]})
                      </Label>
                      <Input
                        id="logAmount"
                        type="number"
                        value={logAmount}
                        onChange={(e) => setLogAmount(e.target.value)}
                        placeholder={`Enter ${challenge.metric}`}
                        required
                        min={0}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isLogging} className="w-full">
                    {isLogging ? "Logging..." : "Log Progress"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          {challenge.isParticipant && myLogs && (
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Total {metricLabels[challenge.metric]}
                  </span>
                  <span className="text-2xl font-bold">
                    {myLogs.items
                      .reduce((sum, log) => sum + log.amount, 0)
                      .toLocaleString(undefined, {
                        maximumFractionDigits:
                          challenge.metric === "liters" ? 1 : 0,
                      })}
                    {challenge.metric === "liters"
                      ? " L"
                      : challenge.metric === "minutes"
                        ? " min"
                        : ""}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Streak</span>
                  <span className="text-2xl font-bold">
                    {myLogs.stats.currentStreakDays} days
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Successful Days</span>
                  <span className="font-medium">
                    {myLogs.stats.successfulDays}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Overachieved Days
                  </span>
                  <span className="font-medium">
                    {myLogs.stats.overachievedDays}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {challenge.visibility === "public" && (
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const validEntries =
                    leaderboard?.filter((entry) => entry?.user) ?? [];
                  if (validEntries.length === 0) {
                    return (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground">
                          No participants yet. Be the first to join and log your
                          progress to appear here!
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {validEntries.map((entry, index) => (
                        <div
                          key={entry.user.id}
                          className={`flex items-center justify-between p-2 rounded ${
                            entry.user.id === user?.id ? "bg-primary/10" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 flex items-center justify-center rounded-full text-sm ${
                                index === 0
                                  ? "bg-yellow-500 text-white"
                                  : index === 1
                                    ? "bg-gray-400 text-white"
                                    : index === 2
                                      ? "bg-amber-700 text-white"
                                      : "bg-muted"
                              }`}
                            >
                              {index + 1}
                            </span>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {(entry.user.name ?? "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {entry.user.name ?? "Unknown"}
                              {entry.user.id === user?.id && " (You)"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{entry.score}</span>
                            <p className="text-xs text-muted-foreground">
                              {entry.successfulDays} days
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Challenge</DialogTitle>
            <DialogDescription>
              Update the challenge details. Changes will be visible to all
              participants.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editForm.description ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-metric">Metric</Label>
                <Select
                  value={editForm.metric ?? "steps"}
                  onValueChange={(value) =>
                    value &&
                    setEditForm({ ...editForm, metric: value as Metric })
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
                <Label htmlFor="edit-dailyTarget">Daily Target</Label>
                <Input
                  id="edit-dailyTarget"
                  type="number"
                  min={1}
                  value={editForm.dailyTarget === 0 ? "" : editForm.dailyTarget}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsed = raw === "" ? 0 : parseInt(raw, 10);
                    setEditForm({
                      ...editForm,
                      dailyTarget: isNaN(parsed) ? 0 : parsed,
                    });
                  }}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={editForm.startDate ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={editForm.endDate ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-visibility">Visibility</Label>
              <Select
                value={editForm.visibility ?? "public"}
                onValueChange={(value) =>
                  value &&
                  setEditForm({
                    ...editForm,
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Challenge</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this challenge? This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

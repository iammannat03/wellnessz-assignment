import Link from "next/link";
import { Brain, Droplet, Footprints } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChallengeSummary } from "@repo/contracts";

const metricIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  steps: Footprints,
  minutes: Brain,
  liters: Droplet,
};

const metricLabels: Record<string, string> = {
  steps: "Steps",
  minutes: "Minutes",
  liters: "Liters",
};

interface ChallengeCardProps {
  challenge: ChallengeSummary;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const isActive = new Date(challenge.endDate) >= new Date();

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="text-3xl flex items-center">
            {(() => {
              const Icon = metricIcons[challenge.metric] ?? Footprints;
              return <Icon className="size-8" />;
            })()}
          </div>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Ended"}
          </Badge>
        </div>
        <CardTitle className="mt-2">{challenge.title}</CardTitle>
        <CardDescription>
          {challenge.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Metric</span>
            <span className="font-medium">
              {metricLabels[challenge.metric]}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Daily Target</span>
            <span className="font-medium">
              {challenge.dailyTarget.toLocaleString()}{" "}
              {challenge.metric === "liters" ? "L" : ""}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Participants</span>
            <span className="font-medium">{challenge.participantsCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">
              {new Date(challenge.startDate).toLocaleDateString()} -{" "}
              {new Date(challenge.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/challenges/${challenge.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

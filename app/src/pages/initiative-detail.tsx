import { useParams, Link } from "react-router-dom"
import { useInitiative, useInitiativeMemory, useInitiativeStakeholders } from "@/hooks/use-initiatives"
import { StatusBadge } from "@/components/initiatives/status-badge"
import { PriorityBadge } from "@/components/initiatives/priority-badge"
import { StalenessIndicator } from "@/components/initiatives/staleness-indicator"
import { TaskProgress } from "@/components/initiatives/task-progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Calendar, User, Bot, Users } from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function InitiativeDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: initiative, isLoading, error } = useInitiative(slug ?? "")
  const { data: memoryContent, isLoading: memoryLoading } = useInitiativeMemory(initiative?.id)
  const { data: stakeholders } = useInitiativeStakeholders(initiative?.id)

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load initiative: {(error as Error).message}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!initiative) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">Initiative not found.</p>
        <Link to="/initiatives" className="text-sm text-primary hover:underline mt-2 inline-block">
          Back to initiatives
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/initiatives" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-4 w-4" />
          Back to initiatives
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{initiative.title}</h1>
          <StatusBadge status={initiative.status} />
          <PriorityBadge priority={initiative.priority} />
        </div>
        {initiative.objective && (
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">{initiative.objective}</p>
        )}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Left: Meta panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetaRow icon={User} label="Owner" value={initiative.ownerName ?? "Unassigned"} />
              <MetaRow icon={Bot} label="Agent" value={initiative.assignedAgent ?? "Unassigned"} mono={!!initiative.assignedAgent} />
              <MetaRow icon={Calendar} label="Start" value={initiative.startDate ?? "—"} />
              <MetaRow icon={Calendar} label="Target" value={initiative.targetDate ?? "—"} />
              <div className="pt-1">
                <span className="text-xs text-muted-foreground block mb-1">Tasks</span>
                <TaskProgress initiative={initiative} />
              </div>
              <div className="pt-1">
                <span className="text-xs text-muted-foreground block mb-1">Memory</span>
                <StalenessIndicator lastUpdated={initiative.memoryLastUpdated} />
              </div>
            </CardContent>
          </Card>

          {/* Stakeholders */}
          {stakeholders && stakeholders.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Stakeholders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stakeholders.map(s => (
                    <div key={s.id} className="text-sm">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground ml-1.5">{s.role}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Memory doc */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Memory Document</CardTitle>
          </CardHeader>
          <CardContent>
            {memoryLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : memoryContent ? (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-base prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
                <Markdown remarkPlugins={[remarkGfm]}>{memoryContent}</Markdown>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">No memory document yet.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Memory docs are created by the Initiative Tracker agent.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetaRow({ icon: Icon, label, value, mono }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground w-12">{label}</span>
      <span className={`text-sm truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  )
}

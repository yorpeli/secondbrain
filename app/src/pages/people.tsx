import { Users } from "lucide-react"

export function PeoplePage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
      <h1 className="text-xl font-semibold text-muted-foreground">People</h1>
      <p className="text-sm text-muted-foreground/70 mt-1">Coming soon</p>
    </div>
  )
}

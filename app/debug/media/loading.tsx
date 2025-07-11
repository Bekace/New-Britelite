import { Card, CardContent } from "@/components/ui/card"

export default function MediaDebugLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="h-4 bg-muted rounded w-96 animate-pulse" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-muted rounded-full animate-pulse" />
                  <div className="h-4 bg-muted rounded w-48 animate-pulse" />
                </div>
                <div className="h-6 bg-muted rounded w-16 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

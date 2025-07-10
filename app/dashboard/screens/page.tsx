import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Monitor } from "lucide-react"

export default function ScreensPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Screens</h1>
          <p className="text-muted-foreground">Manage your digital display screens</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Screen
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Coming Soon
            </CardTitle>
            <CardDescription>Screen management features are currently in development</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This feature will allow you to register, monitor, and control your digital signage displays remotely.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

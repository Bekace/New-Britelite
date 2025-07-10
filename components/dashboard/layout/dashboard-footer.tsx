export function DashboardFooter() {
  return (
    <footer className="border-t bg-background px-6 py-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>&copy; 2024 Digital Signage Platform. All rights reserved.</p>
        <div className="flex items-center space-x-4">
          <a href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-foreground">
            Terms of Service
          </a>
          <a href="/support" className="hover:text-foreground">
            Support
          </a>
        </div>
      </div>
    </footer>
  )
}

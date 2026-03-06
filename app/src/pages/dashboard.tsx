import { Navigate } from "react-router-dom"

export function DashboardPage() {
  // Redirect to initiatives for now — dashboard will be built later
  return <Navigate to="/initiatives" replace />
}

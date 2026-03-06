import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { AppShell } from "@/components/layout/app-shell"
import { DashboardPage } from "@/pages/dashboard"
import { InitiativesPage } from "@/pages/initiatives"
import { InitiativeDetailPage } from "@/pages/initiative-detail"
import { PeoplePage } from "@/pages/people"
import { PPPPage } from "@/pages/ppp"
import { QuarterlyPlanPage } from "@/pages/quarterly-plan"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/initiatives" element={<InitiativesPage />} />
              <Route path="/initiatives/:slug" element={<InitiativeDetailPage />} />
              <Route path="/people" element={<PeoplePage />} />
              <Route path="/ppp" element={<PPPPage />} />
              <Route path="/plans" element={<QuarterlyPlanPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App

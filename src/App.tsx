import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import HistoryPage from "./pages/HistoryPage";
import OnboardingPage from "./pages/OnboardingPage";
import AssessmentPage from "./pages/AssessmentPage";
import ReportPage from "./pages/ReportPage";
import CompanionPage from "./pages/CompanionPage";
import MeditationPage from "./pages/MeditationPage";
import BoxBreathingPage from "./pages/BoxBreathingPage";
import SensesGroundingPage from "./pages/SensesGroundingPage";
import BodyScanPage from "./pages/BodyScanPage";
import TaskAnchoringPage from "./pages/TaskAnchoringPage";
import BrainDumpPage from "./pages/BrainDumpPage";
import ToolkitPage from "./pages/ToolkitPage";
import ModerationDashboard from "./pages/ModerationDashboard";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/companion" element={<CompanionPage />} />
            <Route path="/meditation" element={<MeditationPage />} />
            <Route path="/box-breathing" element={<BoxBreathingPage />} />
            <Route path="/senses-grounding" element={<SensesGroundingPage />} />
            <Route path="/body-scan" element={<BodyScanPage />} />
            <Route path="/task-anchoring" element={<TaskAnchoringPage />} />
            <Route path="/brain-dump" element={<BrainDumpPage />} />
            <Route path="/toolkit" element={<ToolkitPage />} />
            <Route path="/moderation" element={<ModerationDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

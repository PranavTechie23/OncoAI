import { Suspense, lazy, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
const ToasterComponent = lazy(() => import("./components/ui/toaster").then((mod) => ({ default: mod.Toaster })));
const SonnerComponent = lazy(() => import("./components/ui/sonner").then((mod) => ({ default: mod.Toaster })));
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
const ChatBot = lazy(() => import("./components/ChatBot").then((mod) => ({ default: mod.ChatBot })));
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Patients = lazy(() => import("./pages/Patients"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const Reports = lazy(() => import("./pages/Reports"));
const Documentation = lazy(() => import("./pages/Documentation"));
const ApiReference = lazy(() => import("./pages/ApiReference"));
const ResearchPapers = lazy(() => import("./pages/ResearchPapers"));
const Support = lazy(() => import("./pages/Support"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const About = lazy(() => import("./pages/About"));
const PatientDetail = lazy(() => import("./pages/PatientDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { routes } from "./lib/routes";
import { ScrollToTop } from "./components/ScrollToTop";
import { DoctorLayout } from "./components/layout/DoctorLayout";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <DoctorLayout>{children}</DoctorLayout>;
}

function PublicRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useAuth();
  // Redirect to dashboard if already logged in
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

function ReactiveIndex() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Index />
    </Suspense>
  );
}

function ChatBotLoader() {
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    return (
      <Button
        onClick={() => setLoaded(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Suspense fallback={<div className="fixed bottom-6 right-6 z-50 rounded-full bg-white p-3 shadow-lg">Loading chat...</div>}>
      <ChatBot initialOpen />
    </Suspense>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
          <TooltipProvider>
          <Suspense fallback={null}>
            <ToasterComponent />
          </Suspense>
          <Suspense fallback={null}>
            <SonnerComponent position="bottom-right" richColors expand visibleToasts={6} />
          </Suspense>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <ScrollToTop />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicRoute>
                      <Signup />
                    </PublicRoute>
                  }
                />
                <Route path="/" element={<ReactiveIndex />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients"
                element={
                  <ProtectedRoute>
                    <Patients />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients/:id"
                element={
                  <ProtectedRoute>
                    <PatientDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recommendations"
                element={
                  <ProtectedRoute>
                    <Recommendations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              {/* Public resource routes */}
              <Route path="/about" element={<About />} />
              <Route path={routes.DOCUMENTATION} element={<Documentation />} />
              <Route path={routes.API_REFERENCE} element={<ApiReference />} />
              <Route path={routes.RESEARCH_PAPERS} element={<ResearchPapers />} />
              <Route path={routes.SUPPORT} element={<Support />} />
              <Route path={routes.PRIVACY} element={<Privacy />} />
              <Route path={routes.TERMS} element={<Terms />} />
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            {process.env.NODE_ENV !== 'production' ? <ChatBotLoader /> : <ChatBotLoader />}
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
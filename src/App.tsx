import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserManagement from "./pages/UserManagement";
import AgentManagement from "./pages/AgentManagement";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import AccessDenied from "./pages/AccessDenied";
import BusinessOnboarding from "./pages/BusinessOnboarding";
import ClientCases from "./pages/ClientCases";
import ClientCaseDetail from "./pages/ClientCaseDetail";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import EligibilityEngine from "./pages/EligibilityEngine";
import LenderPolicyAdmin from "./pages/LenderPolicyAdmin";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

// Route that requires user management permissions (admin/super_admin only)
function UserManagementRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, canManageUsers } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!canManageUsers) {
    return (
      <AccessDenied 
        requiredRole="Admin or Super Admin" 
        message="You need administrator privileges to manage users and roles."
      />
    );
  }
  
  return <>{children}</>;
}

// Route that requires agent management permissions (admin/super_admin/supervisor)
function AgentManagementRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, canManageAgents } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!canManageAgents) {
    return (
      <AccessDenied 
        requiredRole="Supervisor, Admin, or Super Admin" 
        message="You need agent management privileges to access this page."
      />
    );
  }
  
  return <>{children}</>;
}

// Auth route - redirect to home if already logged in
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Supervisor route (supervisor, admin, super_admin)
function SupervisorRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isSupervisor, hasAdminPrivileges } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!isSupervisor && !hasAdminPrivileges) {
    return (
      <AccessDenied 
        requiredRole="Supervisor, Admin, or Super Admin" 
        message="You need supervisor privileges to access this dashboard."
      />
    );
  }
  
  return <>{children}</>;
}

// Admin route (admin, super_admin only)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, hasAdminPrivileges } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!hasAdminPrivileges) {
    return (
      <AccessDenied 
        requiredRole="Admin or Super Admin" 
        message="You need administrative privileges to access this dashboard."
      />
    );
  }
  
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/cases" element={<ProtectedRoute><Cases /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
    <Route path="/admin/users" element={<UserManagementRoute><UserManagement /></UserManagementRoute>} />
    <Route path="/admin/agents" element={<AgentManagementRoute><AgentManagement /></AgentManagementRoute>} />
    {/* Dashboard Routes */}
    <Route path="/supervisor" element={<SupervisorRoute><SupervisorDashboard /></SupervisorRoute>} />
    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    {/* Business Onboarding Routes */}
    <Route path="/onboarding" element={<ProtectedRoute><BusinessOnboarding /></ProtectedRoute>} />
    <Route path="/client-cases" element={<ProtectedRoute><ClientCases /></ProtectedRoute>} />
    <Route path="/client-cases/:id" element={<ProtectedRoute><ClientCaseDetail /></ProtectedRoute>} />
    {/* Eligibility Assessment Engine */}
    <Route path="/eligibility-engine" element={<ProtectedRoute><EligibilityEngine /></ProtectedRoute>} />
    {/* Lender Policy Administration */}
    <Route path="/lender-policy-admin" element={<AdminRoute><LenderPolicyAdmin /></AdminRoute>} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

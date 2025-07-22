import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import RoleSelection from "@/pages/RoleSelection";
import AdminDashboard from "@/pages/AdminDashboard";
import AuditorDashboard from "@/pages/AuditorDashboard";
import ReviewerDashboard from "@/pages/ReviewerDashboard";
import CorporateDashboard from "@/pages/CorporateDashboard";
import HotelGMDashboard from "@/pages/HotelGMDashboard";
import AIDemoPage from "@/pages/AIDemoPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/roles" component={RoleSelection} />
      <Route path="/ai-demo" component={AIDemoPage} />
      
      <Route path="/admin">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/auditor">
        <ProtectedRoute allowedRoles={['auditor']}>
          <AuditorDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/reviewer">
        <ProtectedRoute allowedRoles={['reviewer']}>
          <ReviewerDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/corporate">
        <ProtectedRoute allowedRoles={['corporate']}>
          <CorporateDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/hotel-gm">
        <ProtectedRoute allowedRoles={['hotelgm']}>
          <HotelGMDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/unauthorized" component={() => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

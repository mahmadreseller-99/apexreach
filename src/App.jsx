import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns.jsx';
import CampaignCreator from './pages/CampaignCreator';
import CampaignAnalytics from './pages/CampaignAnalytics';
import Contacts from './pages/Contacts';
import SmtpManagement from './pages/SmtpManagement';
import Templates from './pages/Templates';
import ActivityPage from './pages/ActivityPage';
import Settings from './pages/Settings';
import AppLayout from './components/layout/AppLayout.jsx';
import SmtpWarmup from './pages/SmtpWarmup';
import DripSequences from './pages/DripSequences';
import Guide from './pages/Guide';
import TemplateEditor from './pages/TemplateEditor';

const ProtectedRoute = ({ children }) => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-body">Loading ApexReach...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/new" element={<CampaignCreator />} />
        <Route path="/campaigns/:id/edit" element={<CampaignCreator />} />
        <Route path="/campaigns/:id/analytics" element={<CampaignAnalytics />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/smtp" element={<SmtpManagement />} />
        <Route path="/smtp/warmup" element={<SmtpWarmup />} />
        <Route path="/drip" element={<DripSequences />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/templates/editor" element={<TemplateEditor />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AppRoutes />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
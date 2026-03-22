import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import RouteTransition from '@/components/RouteTransition';
import { TabNavigationProvider } from '@/context/TabNavigationContext';

import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import LiveGrid from './pages/LiveGrid';
import Rides from './pages/Rides';
import RideDetails from './pages/RideDetails';
import CreateRide from './pages/CreateRide';
import Profile from './pages/Profile';
import Messages from './pages/Messages';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs text-muted-foreground">Loading RideRadar...</p>
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

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RouteTransition><Home /></RouteTransition>} />
          <Route path="/grid" element={<RouteTransition><LiveGrid /></RouteTransition>} />
          <Route path="/rides" element={<RouteTransition><Rides /></RouteTransition>} />
          <Route path="/rides/:rideId" element={<RouteTransition><RideDetails /></RouteTransition>} />
          <Route path="/create-ride" element={<RouteTransition><CreateRide /></RouteTransition>} />
          <Route path="/profile" element={<RouteTransition><Profile /></RouteTransition>} />
          <Route path="/messages" element={<RouteTransition><Messages /></RouteTransition>} />
        </Route>
        <Route path="*" element={<RouteTransition><PageNotFound /></RouteTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <TabNavigationProvider>
            <AuthenticatedApp />
          </TabNavigationProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
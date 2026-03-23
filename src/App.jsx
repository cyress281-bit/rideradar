import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import RouteTransition from '@/components/RouteTransition';
import { TabNavigationProvider } from '@/context/TabNavigationContext';
import { NavigationDirectionProvider } from '@/context/NavigationDirectionContext';

import AppLayout from './components/layout/AppLayout';
import SystemAppearanceSync from '@/components/system/SystemAppearanceSync';
const Home = lazy(() => import('./pages/Home'));
const LiveGrid = lazy(() => import('./pages/LiveGrid'));
const Rides = lazy(() => import('./pages/Rides'));
const RideDetails = lazy(() => import('./pages/RideDetails'));
const CreateRide = lazy(() => import('./pages/CreateRide'));
const Profile = lazy(() => import('./pages/Profile'));
const Messages = lazy(() => import('./pages/Messages'));

const PageLoader = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex items-center justify-center h-screen"
  >
    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  </motion.div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  React.useEffect(() => {
    if (authError?.type === 'auth_required') {
      navigateToLogin();
    }
  }, [authError]);

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
      return null;
    }
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Suspense fallback={<PageLoader />}><RouteTransition><Home /></RouteTransition></Suspense>} />
          <Route path="/grid" element={<Suspense fallback={<PageLoader />}><RouteTransition><LiveGrid /></RouteTransition></Suspense>} />
          <Route path="/rides" element={<Suspense fallback={<PageLoader />}><RouteTransition><Rides /></RouteTransition></Suspense>} />
          <Route path="/rides/:rideId" element={<Suspense fallback={<PageLoader />}><RouteTransition><RideDetails /></RouteTransition></Suspense>} />
          <Route path="/create-ride" element={<Suspense fallback={<PageLoader />}><RouteTransition><CreateRide /></RouteTransition></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<PageLoader />}><RouteTransition><Profile /></RouteTransition></Suspense>} />
          <Route path="/messages" element={<Suspense fallback={<PageLoader />}><RouteTransition><Messages /></RouteTransition></Suspense>} />
        </Route>
        <Route path="*" element={<RouteTransition><PageNotFound /></RouteTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <SystemAppearanceSync />
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationDirectionProvider>
            <TabNavigationProvider>
              <AuthenticatedApp />
            </TabNavigationProvider>
          </NavigationDirectionProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
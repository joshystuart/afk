import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { ROUTES } from './utils/constants';

// Pages
import Dashboard from './pages/Dashboard';
import SessionDetails from './pages/SessionDetails';
import CreateSession from './pages/CreateSession';
import Settings from './pages/Settings';
import Login from './pages/Login';

// Layout
import Layout from './components/Layout';

// AFK Theme
import { afkTheme } from './themes/afk';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
};

// Main App component with WebSocket connection
const AppContent = () => {
  // Initialize WebSocket connection for authenticated users
  useWebSocket();

  return (
    <Router>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route
          path={ROUTES.HOME}
          element={<Navigate to={ROUTES.DASHBOARD} replace />}
        />
        {/* All authenticated routes use Layout */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CREATE_SESSION}
          element={
            <ProtectedRoute>
              <Layout>
                <CreateSession />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SESSION_DETAILS}
          element={
            <ProtectedRoute>
              <Layout>
                <SessionDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={afkTheme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

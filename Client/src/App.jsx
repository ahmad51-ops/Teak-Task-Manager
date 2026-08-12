import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import AppRoutes from "./routes/AppRoutes";
import ErrorBoundary from "./components/common/ErrorBoundary";

// ErrorBoundary sits at the very outside — a render crash anywhere in
// the app (a bad API response shape, a null reference in a page) shows
// a themed recovery screen instead of React's default blank white
// screen. AuthProvider/NotificationProvider stay inside it so a crash
// there is caught too, not just crashes within AppRoutes.
const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;

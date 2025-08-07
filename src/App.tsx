import { BrowserRouter as Router } from "react-router";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AppRoutes from "./routes/AppRoutes.tsx";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <AppRoutes />
        <Toaster 
          position="top-right"
          gutter={4}
          containerStyle={{
            top: 80,
            right: 20,
          }}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#10B981',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              margin: '4px 0', // Giảm margin giữa các toast
            },
            success: {
              iconTheme: {
                primary: '#fff',
                secondary: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
                margin: '4px 0', // Giảm margin cho error toast
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#EF4444',
              },
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
}

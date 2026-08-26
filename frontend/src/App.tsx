// src/App.tsx

import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // <-- 1. NEW IMPORT
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Register from './pages/Login/Register';
import './App.css';
import { ResetPassword } from './pages/Login/ResetPassword';
import { ForgotPassword } from './pages/Login/ForgotPassword';

// <-- 2. CREATE THE CLIENT -->
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data remains "fresh" for 5 minutes without hitting the API
      refetchOnWindowFocus: true, // Auto-refreshes in the background if the user switches browser tabs
    },
  },
});

function App() {
  return (
    // <-- 3. WRAP THE APP WITH THE PROVIDER -->
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UploadLeads from './pages/admin/UploadLeads';
import ManageSalespeople from './pages/admin/ManageSalespeople';
import AllLeads from './pages/admin/AllLeads';
import Reports from './pages/admin/Reports';
import AdminProfile from './pages/admin/AdminProfile';

// Salesperson Pages
import MyLeadsList from './pages/salesperson/MyLeadsList';

// Shared Pages
import Leaderboard from './pages/Leaderboard';

function App() {
  // Helper component to strip a leading locale segment like /en or /en-US
  const LocaleRedirect = () => {
    const location = useLocation();
    // Remove the first path segment (locale) and keep the rest
    const stripped = location.pathname.replace(/^\/[A-Za-z]{2}(?:-[A-Za-z]{2})?/, '');
    const target = stripped && stripped !== '/' ? stripped : '/login';
    return <Navigate to={target} replace />;
  };

  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <div className="min-h-screen bg-gray-50">
                  <Navbar />
                  <div className="flex pt-16">
                    <Sidebar />
                    <main className="flex-1 p-0 md:p-8">
                      <div className="w-full mx-auto max-w-[430px] md:max-w-none px-3 md:px-0">
                        <Routes>
                          <Route path="/" element={<AdminDashboard />} />
                          <Route path="/leads" element={<AllLeads />} />
                          <Route path="/upload" element={<UploadLeads />} />
                          <Route path="/salespeople" element={<ManageSalespeople />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/leaderboard" element={<Leaderboard />} />
                          <Route path="/profile" element={<AdminProfile />} />
                        </Routes>
                      </div>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Salesperson Routes */}
          <Route
            path="/salesperson/*"
            element={
              <ProtectedRoute allowedRoles={['salesperson']}>
                <div className="min-h-screen bg-gray-50">
                  <Navbar />
                  <div className="flex pt-16">
                    <Sidebar />
                    <main className="flex-1 p-0 md:p-8">
                      <div className="w-full mx-auto max-w-[430px] md:max-w-none px-3 md:px-0">
                        <Routes>
                          <Route path="/" element={<Leaderboard />} />
                          <Route path="/leads" element={<MyLeadsList />} />
                          <Route path="/leaderboard" element={<Leaderboard />} />
                        </Routes>
                      </div>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          {/* Locale-prefixed routes (e.g., /en, /en-US) redirect to non-locale path */}
          <Route path=":lang/*" element={<LocaleRedirect />} />

          {/* Catch-all fallback to avoid "No routes matched" warnings */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

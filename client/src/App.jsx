import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation } from 'react-router-dom';
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
import AdminPopups from './components/AdminPopups';

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';

// Salesperson Pages
import MyLeadsList from './pages/salesperson/MyLeadsList';

// Shared Pages
import Leaderboard from './pages/Leaderboard';

// Helper component to strip a leading locale segment like /en or /en-US
const LocaleRedirect = () => {
  const location = useLocation();
  // Remove the first path segment (locale) and keep the rest
  const stripped = location.pathname.replace(/^\/[A-Za-z]{2}(?:-[A-Za-z]{2})?/, '');
  const target = stripped && stripped !== '/' ? stripped : '/login';
  return <Navigate to={target} replace />;
};

// Shared layout for Admin
const AdminLayout = () => (
  <ProtectedRoute allowedRoles={['admin', 'accountant', 'super_admin']}>
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-0 md:p-8">
          <div className="w-full mx-auto max-w-[430px] md:max-w-none px-3 md:px-0">
            <AdminPopups />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  </ProtectedRoute>
);

// Shared layout for Salesperson
const SuperAdminLayout = () => (
  <ProtectedRoute allowedRoles={['super_admin']}>
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-0 md:p-8">
          <div className="w-full mx-auto max-w-[430px] md:max-w-none px-3 md:px-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  </ProtectedRoute>
);

const SalespersonLayout = () => (
  <ProtectedRoute allowedRoles={['salesperson']}>
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-0 md:p-8">
          <div className="w-full mx-auto max-w-[430px] md:max-w-none px-3 md:px-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  </ProtectedRoute>
);

import PaymentRequired from './pages/PaymentRequired';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/payment-required', element: <PaymentRequired /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'leads', element: <AllLeads /> },
      { path: 'upload', element: <UploadLeads /> },
      { path: 'salespeople', element: <ManageSalespeople /> },
      { path: 'reports', element: <Reports /> },
      { path: 'leaderboard', element: <Leaderboard /> },
      { path: 'profile', element: <AdminProfile /> }
    ]
  },
  {
    path: '/super-admin',
    element: <SuperAdminLayout />,
    children: [
      { index: true, element: <SuperAdminDashboard /> },
      { path: 'companies', element: <SuperAdminDashboard /> } // Reusing dash for now
    ]
  },
  {
    path: '/salesperson',
    element: <SalespersonLayout />,
    children: [
      { index: true, element: <Leaderboard /> },
      { path: 'leads', element: <MyLeadsList /> },
      { path: 'leaderboard', element: <Leaderboard /> }
    ]
  },
  // Default redirect
  { path: '/', element: <Navigate to="/login" replace /> },
  // Locale-prefixed routes (e.g., /en, /en-US) redirect to non-locale path
  { path: ':lang/*', element: <LocaleRedirect /> },
  // Catch-all
  { path: '*', element: <Navigate to="/login" replace /> }
]);

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <RouterProvider
        router={router}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      />
    </AuthProvider>
  );
}

export default App;

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sync branding color
    const primaryColor = user?.company?.primaryColor || '#22c55e';
    document.documentElement.style.setProperty('--color-primary-600', primaryColor);
    // You might want to generate shades here if you strictly follow Tailwind shades,
    // but setting the base color is a good start. For strict Tailwind mapping,
    // you'd typically need a more complex generator or just use the primary as an inline style override on specific elements.
    // For now, let's assume we might just set a global CSS variable that our custom CSS uses.
  }, [user]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token) {
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        // Fetch fresh user data (msg, company settings, etc)
        try {
          const res = await authAPI.getMe();
          setUser(res.data.data);
          // Optional: Update local storage?
          localStorage.setItem('user', JSON.stringify(res.data.data));
        } catch (error) {
          // If token invalid, maybe logout? For now just log
          console.error('Failed to refresh user:', error);
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, ...userData } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      toast.success('Login successful!');
      return userData;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const loginWithPhone = async ({ phone, password }) => {
    try {
      const response = await authAPI.loginPhone({ phone, password });
      const { token, ...userData } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      toast.success('Login successful!');
      return userData;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      toast.success('Registration successful!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const isAdminRole = ['admin', 'accountant', 'super_admin'].includes(user?.role);
  const isAccountant = user?.role === 'accountant';

  const value = {
    user,
    loading,
    login,
    loginWithPhone,
    logout,
    register,
    isAdmin: isAdminRole,
    isAccountant,
    isSuperAdmin: user?.role === 'super_admin',
    isSalesperson: user?.role === 'salesperson'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

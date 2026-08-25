import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api, configureApiClient, setApiAccessToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync React state and API client in-memory token
  const handleTokenUpdate = useCallback((newToken, newUser) => {
    setAccessToken(newToken);
    setApiAccessToken(newToken);
    if (newUser !== undefined) {
      setUser(newUser);
    }
  }, []);

  const handleAuthFailed = useCallback(() => {
    setAccessToken(null);
    setApiAccessToken(null);
    setUser(null);
  }, []);

  // Configure API client callback bindings
  useEffect(() => {
    configureApiClient({
      setToken: handleTokenUpdate,
      onAuthFailed: handleAuthFailed
    });
  }, [handleTokenUpdate, handleAuthFailed]);

  /**
   * Silent refresh session on startup (reads HttpOnly cookie via backend)
   */
  const refreshSession = useCallback(async () => {
    try {
      const result = await api.refreshToken();
      if (result.success && result.accessToken) {
        setAccessToken(result.accessToken);
        setApiAccessToken(result.accessToken);
        if (result.user) {
          setUser(result.user);
        } else {
          // If user not included, fetch profile via /me
          const meUser = await api.getMe();
          if (meUser) setUser(meUser);
        }
        return { success: true };
      } else {
        handleAuthFailed();
        return { success: false };
      }
    } catch (err) {
      handleAuthFailed();
      return { success: false, error: err.message };
    }
  }, [handleAuthFailed]);

  // Initial boot: perform silent refresh
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await refreshSession();
      } catch (e) {
        console.warn('Auth boot initial refresh note:', e.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refreshSession]);

  /**
   * User Login
   */
  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    try {
      const result = await api.login({ email, password });
      if (result.success) {
        setAccessToken(result.accessToken);
        setApiAccessToken(result.accessToken);
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        return {
          success: false,
          error: result.error?.message || 'Login failed',
          code: result.error?.code || 'LOGIN_ERROR',
          status: result.status
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Network error',
        code: 'NETWORK_ERROR'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * User Registration
   */
  const register = useCallback(async ({ username, email, password, preferredAccent, targetBand }) => {
    setLoading(true);
    try {
      const result = await api.register({ username, email, password, preferredAccent, targetBand });
      if (result.success) {
        // Auto-login after successful registration
        return await login({ email, password });
      } else {
        return {
          success: false,
          error: result.error?.message || 'Registration failed',
          code: result.error?.code || 'REGISTER_ERROR',
          status: result.status
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Network error',
        code: 'NETWORK_ERROR'
      };
    } finally {
      setLoading(false);
    }
  }, [login]);

  /**
   * Logout from current device
   */
  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      handleAuthFailed();
    }
  }, [handleAuthFailed]);

  /**
   * Logout from all devices
   */
  const logoutAll = useCallback(async () => {
    try {
      await api.logoutAll();
    } finally {
      handleAuthFailed();
    }
  }, [handleAuthFailed]);

  /**
   * Optimistic User profile update (e.g. accent preference)
   */
  const updateUser = useCallback((updatedFields) => {
    setUser(prev => (prev ? { ...prev, ...updatedFields } : null));
  }, []);

  const value = useMemo(() => ({
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    loading,
    role: user?.role || 'user',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    logoutAll,
    refreshSession,
    updateUser
  }), [user, accessToken, loading, login, register, logout, logoutAll, refreshSession, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

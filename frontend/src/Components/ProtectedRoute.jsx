import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getMe } from '../API/auth';

let sessionActiveCache = false;

export const resetSessionCache = () => {
  sessionActiveCache = false;
};

export function ProtectedRoute({ children, adminOnly = false }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cc_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('cc_auth') === 'true') {
      sessionActiveCache = true;
      return true;
    }
    return sessionActiveCache ? true : null;
  });

  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      try {
        const data = await getMe();
        if (isMounted) {
          if (data && data.success && data.user) {
            sessionActiveCache = true;
            setCurrentUser(data.user);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('cc_auth', 'true');
              localStorage.setItem('cc_user', JSON.stringify(data.user));
            }
            setIsAuthenticated(true);
          } else {
            sessionActiveCache = false;
            setCurrentUser(null);
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('cc_auth');
              localStorage.removeItem('cc_user');
            }
            setIsAuthenticated(false);
          }
        }
      } catch {
        if (isMounted) {
          sessionActiveCache = false;
          setCurrentUser(null);
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('cc_auth');
            localStorage.removeItem('cc_user');
          }
          setIsAuthenticated(false);
        }
      }
    };
    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen glass-canvas flex items-center justify-center text-white">
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && currentUser && currentUser.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default ProtectedRoute;

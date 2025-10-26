import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, verifySession, logout } from '../lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>(() =>
    isAuthenticated() ? 'checking' : 'denied'
  );

  useEffect(() => {
    let cancelled = false;

    const checkAccess = async () => {
      if (!isAuthenticated()) {
        setStatus('denied');
        return;
      }

      try {
        await verifySession();
        if (!cancelled) {
          setStatus('allowed');
        }
      } catch {
        logout();
        if (!cancelled) {
          setStatus('denied');
        }
      }
    };

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') {
    return null;
  }

  if (status === 'denied') {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

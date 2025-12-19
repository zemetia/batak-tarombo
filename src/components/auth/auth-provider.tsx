'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@prisma/client';

export type UserSession = {
  userId: string;
  email: string;
  role: UserRole;
  fullName?: string;
  avatarUrl?: string;
} | null;

interface AuthContextType {
  user: UserSession;
  loading: boolean;
  logout: () => Promise<void>;
  setUser: (user: UserSession) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  setUser: () => {}
});

export function AuthProvider({ 
  children, 
  initialUser = null 
}: { 
  children: React.ReactNode; 
  initialUser?: UserSession;
}) {
  const [user, setUser] = useState<UserSession>(initialUser);
  const [loading, setLoading] = useState(false);

  // Sync initialUser if it changes (e.g. after server mutation and revalidation)
  useEffect(() => {
    if (initialUser) {
        setUser(initialUser);
    }
  }, [initialUser]);

  const logout = async () => {
    try {
      // Call server action to delete cookie
      // For now we just reload which triggers the server logic if we had a logout endpoint
      // Or we can manually remove client cookie if not httpOnly, but it is httpOnly
      // We need a logout action
      setUser(null);
      // document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'; // Can't delete httpOnly
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

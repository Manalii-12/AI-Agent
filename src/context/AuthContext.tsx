'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  sampleOrderId?: string;
  isTestUser?: boolean;
}

// Built-in test users matching the DataStraw mock database
export const TEST_USERS: UserProfile[] = [
  {
    id: 'user-101',
    name: 'Priya Sharma',
    email: 'priya@auraskincare.in',
    phone: '+91 98765 43210',
    sampleOrderId: 'ORD-101',
    isTestUser: true,
  },
  {
    id: 'user-102',
    name: 'Rahul Verma',
    email: 'rahul@auraskincare.in',
    phone: '+91 98111 22334',
    sampleOrderId: 'ORD-102',
    isTestUser: true,
  },
  {
    id: 'user-103',
    name: 'Ananya Patel',
    email: 'ananya@auraskincare.in',
    phone: '+91 99222 33445',
    sampleOrderId: 'ORD-103',
    isTestUser: true,
  },
];

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loginAsTestUser: (userId: string) => void;
  loginWithCredentials: (email: string, password?: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(TEST_USERS[0]);

  // Load persisted user session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('aura_current_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(TEST_USERS[0]);
      }
    } catch (e) {
      setUser(TEST_USERS[0]);
    }
  }, []);

  const persistUser = (newUser: UserProfile | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('aura_current_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('aura_current_user');
    }
  };

  const loginAsTestUser = (userId: string) => {
    const found = TEST_USERS.find((u) => u.id === userId);
    if (found) {
      persistUser(found);
    }
  };

  const loginWithCredentials = (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    // Check if matching test user
    const foundTest = TEST_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
    if (foundTest) {
      persistUser(foundTest);
      return { success: true };
    }

    // Check custom registered users in localStorage
    try {
      const registeredStr = localStorage.getItem('aura_registered_users');
      const registered: UserProfile[] = registeredStr ? JSON.parse(registeredStr) : [];
      const match = registered.find((u) => u.email.toLowerCase() === cleanEmail);
      if (match) {
        persistUser(match);
        return { success: true };
      }
    } catch (e) {}

    // Allow flexible login with email for easy testing
    const fallbackUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: cleanEmail,
      isTestUser: false,
    };
    persistUser(fallbackUser);
    return { success: true };
  };

  const signup = (name: string, email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    if (!cleanName || !cleanEmail) {
      return { success: false, error: 'Name and email are required.' };
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      isTestUser: false,
    };

    try {
      const registeredStr = localStorage.getItem('aura_registered_users');
      const registered: UserProfile[] = registeredStr ? JSON.parse(registeredStr) : [];
      registered.push(newUser);
      localStorage.setItem('aura_registered_users', JSON.stringify(registered));
    } catch (e) {}

    persistUser(newUser);
    return { success: true };
  };

  const logout = () => {
    persistUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loginAsTestUser,
        loginWithCredentials,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

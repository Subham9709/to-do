import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';
import { 
  signInWithPopup, 
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile as firebaseUpdateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  language: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  settings: UserSettings;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User> & { password?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('todo-token');
      const savedUser = localStorage.getItem('todo-user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        
        // Fetch fresh profile in background
        try {
          const res = await API.get('/auth/profile');
          setUser(res.data);
          localStorage.setItem('todo-user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Failed to restore session', err);
          // If profile fails, interceptor might have already logged out
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      const res = await API.post('/auth/google', { idToken });
      const { token: userToken, ...userData } = res.data;
      
      setToken(userToken);
      setUser(userData);
      localStorage.setItem('todo-token', userToken);
      localStorage.setItem('todo-user', JSON.stringify(userData));
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await firebaseUpdateProfile(result.user, { displayName: name });
      const idToken = await result.user.getIdToken(true);
      const res = await API.post('/auth/google', { idToken, name });
      const { token: userToken, ...userData } = res.data;

      setToken(userToken);
      setUser(userData);
      localStorage.setItem('todo-token', userToken);
      localStorage.setItem('todo-user', JSON.stringify(userData));
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await API.post('/auth/google', { idToken });
      const { token: userToken, ...userData } = res.data;

      setToken(userToken);
      setUser(userData);
      localStorage.setItem('todo-token', userToken);
      localStorage.setItem('todo-user', JSON.stringify(userData));
    } finally {
      setLoading(false);
    }
  };

  const loginWithApple = async () => {
    setLoading(true);
    try {
      const provider = new OAuthProvider('apple.com');
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const res = await API.post('/auth/google', { idToken });
      const { token: userToken, ...userData } = res.data;

      setToken(userToken);
      setUser(userData);
      localStorage.setItem('todo-token', userToken);
      localStorage.setItem('todo-user', JSON.stringify(userData));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('todo-token');
    localStorage.removeItem('todo-user');
    window.location.href = '/login';
  };

  const updateProfile = async (data: Partial<User> & { password?: string }) => {
    try {
      const res = await API.put('/auth/profile', data);
      const { token: userToken, ...userData } = res.data;
      
      setUser(userData);
      localStorage.setItem('todo-user', JSON.stringify(userData));
      if (userToken) {
        setToken(userToken);
        localStorage.setItem('todo-token', userToken);
      }
    } catch (err) {
      console.error('Failed to update profile', err);
      throw err;
    }
  };

  const deleteAccount = async () => {
    try {
      await API.delete('/auth/profile');
      logout();
    } catch (err) {
      console.error('Failed to delete account', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        forgotPassword,
        logout,
        updateProfile,
        deleteAccount,
      }}
    >
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

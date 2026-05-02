import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  level: string;
  department: string;
  post: string;
  center_id?: string;
  province?: string;
  sous_province?: string;
  postnom?: string;
  prenom?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  mustChangePassword: boolean;
  setMustChangePassword: (v: boolean) => void;
  token: string | null;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un token existe dans le localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Valider le token avec le serveur
      fetchProfile(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch(apiUrl('/api/auth/profile'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate device fingerprint — MACHINE-level (pas browser)
  // Exclut userAgent et Date.now() pour que Chrome/Firefox sur la même machine matchent
  const getFingerprint = (): string => {
    const nav: any = window.navigator;
    // Caractéristiques stables partagées entre tous les browsers d'une même machine
    const raw = [
      nav.language || '',
      nav.hardwareConcurrency || 0,
      screen.width, screen.height, screen.colorDepth, screen.availWidth, screen.availHeight,
      new Date().getTimezoneOffset(),
      nav.platform || '',
      nav.deviceMemory || 0,
      nav.maxTouchPoints || 0,
    ].join('|');
    // Hash déterministe (FNV-1a 32 bit)
    let hash = 0x811c9dc5;
    for (let i = 0; i < raw.length; i++) {
      hash ^= raw.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    const fp = 'DEV-' + hash.toString(36).padStart(7, '0');
    // Cache en localStorage pour performance (identique au calcul déterministe)
    localStorage.setItem('device_fingerprint_v2', fp);
    return fp;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const fingerprint = getFingerprint();
      const nav = window.navigator;
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email, password, fingerprint,
          device_name: nav.platform || 'Web',
          browser: nav.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Navigateur',
          os: nav.platform || 'Inconnu'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
        if (data.must_change_password) setMustChangePassword(true);
        toast.success('Connexion réussie');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur de connexion');
        return false;
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      toast.error('Erreur de connexion');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Déconnexion réussie');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, mustChangePassword, setMustChangePassword, token: localStorage.getItem("token"), setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
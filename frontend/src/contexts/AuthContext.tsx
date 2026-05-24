import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/services/api";
import { db } from "@/db/db";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  store_name: string;
  business_category?: string;
  product_subcategories?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  // Listen for forced logout events from API interceptor
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser && storedUser !== "undefined") {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Set default authorization header for api
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
      const response = await api.post("/users/login", {
        email,
        password,
      });

      const { newToken, userData } = response.data.data;

      if (!newToken) {
        throw new Error("Invalid response from server");
      }

      // Store in state
      setToken(newToken);
      setUser(userData);

      // Store in localStorage
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Set default authorization header for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    
  };

  const logout = async () => {
    // Clear state
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear Dexie database to prevent cross-account data leakage
    try {
        await Promise.all([
          db.products.clear(),
          db.categories.clear(),
          db.suppliers.clear(),
          db.sales.clear(),
          db.customers.clear(),
          db.notifications.clear(),
          db.debts.clear(),
          db.product_variants.clear(),
          db.pending_returns.clear(),
        ])
    } catch (error) {
      console.error("Failed to clear local database:", error);
    }

    // Remove authorization header
    delete api.defaults.headers.common["Authorization"];
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    loading,
    updateUser: (userData: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return null;
        const newUser = { ...prev, ...userData };
        localStorage.setItem("user", JSON.stringify(newUser));
        return newUser;
      });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

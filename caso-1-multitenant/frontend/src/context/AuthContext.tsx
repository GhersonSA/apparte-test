import {
  createContext,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState
} from "react";

import { loginRequest, meRequest } from "../api/auth";
import { ApiError } from "../api/http";
import { clearStoredToken, getStoredToken, setStoredToken } from "../auth/storage";
import { AuthTenant, AuthUser, LoginRequest } from "../types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
  tenant: AuthTenant | null;
  login: (input: LoginRequest) => Promise<void>;
  logout: () => void;
};

const authContextDefault: AuthContextValue = {
  status: "loading",
  token: null,
  user: null,
  tenant: null,
  login: async () => {
    throw new Error("AuthProvider missing");
  },
  logout: () => {
    throw new Error("AuthProvider missing");
  }
};

export const AuthContext = createContext<AuthContextValue>(authContextDefault);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<AuthTenant | null>(null);

  useEffect(() => {
    const existingToken = getStoredToken();

    if (!existingToken) {
      setStatus("unauthenticated");
      return;
    }

    meRequest(existingToken)
      .then((response) => {
        setToken(existingToken);
        setUser(response.user);
        setStatus("authenticated");
      })
      .catch(() => {
        clearStoredToken();
        setToken(null);
        setUser(null);
        setTenant(null);
        setStatus("unauthenticated");
      });
  }, []);

  async function login(input: LoginRequest) {
    try {
      const response = await loginRequest(input);
      setStoredToken(response.token);
      setToken(response.token);
      setUser(response.user);
      setTenant(response.tenant);
      setStatus("authenticated");
    } catch (error) {
      clearStoredToken();
      setToken(null);
      setUser(null);
      setTenant(null);
      setStatus("unauthenticated");

      if (error instanceof ApiError) {
        throw error;
      }

      throw new Error("Error inesperado al iniciar sesión");
    }
  }

  function logout() {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setTenant(null);
    setStatus("unauthenticated");
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      token,
      user,
      tenant,
      login,
      logout
    }),
    [status, token, user, tenant]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

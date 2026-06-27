import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("nexar_token");
    if (!token) { setLoading(false); return; }
    authApi.me().then(setUser).catch(() => localStorage.removeItem("nexar_token")).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token, user } = await authApi.login({ email, password });
    localStorage.setItem("nexar_token", token);
    setUser(user);
    return user;
  };

  const signup = async (name, email, password) => {
    const { token, user } = await authApi.signup({ name, email, password });
    localStorage.setItem("nexar_token", token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("nexar_token");
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);

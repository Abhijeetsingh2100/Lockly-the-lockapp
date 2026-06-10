import React, { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'admin' | 'user' | null;

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  setRole: () => {},
});

export const AuthProvider = ({ children, initialRole }: { children: ReactNode, initialRole: Role }) => {
  const [role, setRole] = useState<Role>(initialRole);

  return (
    <AuthContext.Provider value={{ role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

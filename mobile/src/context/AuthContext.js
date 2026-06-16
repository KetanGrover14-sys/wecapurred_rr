import React, { createContext, useContext, useState } from 'react';

const VALID_EMAIL    = 'ketangrover2002@gmail.com';
const VALID_PASSWORD = 'Ket@n@0114';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const signIn = async (email, password) => {
    if (email.trim().toLowerCase() !== VALID_EMAIL || password !== VALID_PASSWORD) {
      throw new Error('Invalid email or password.');
    }
    setUser({ email: VALID_EMAIL, name: 'Ketan' });
  };

  const signOut = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loading: false, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create profile in Firestore
        const profileRef = doc(db, 'users', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        } else {
          // Create default profile for new user
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'New Explorer',
            username: `user_${currentUser.uid.substring(0, 5)}`,
            photoURL: currentUser.photoURL || '',
            bio: '',
            isPrivate: true, // private by default per your request
            followersCount: 0,
            followingCount: 0,
            createdAt: Date.now()
          };
          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    await setDoc(profileRef, updates, { merge: true });
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

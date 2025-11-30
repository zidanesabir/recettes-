import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface User {
  uid: string;
  email: string;
  username?: string;
  avatar?: string;
  role?: string;
  favorites?: string[];
  bookmarks?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  //  Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);

        const firestoreUser = snap.exists() ? snap.data() : {};

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          username: firestoreUser?.username || "",
          avatar: firestoreUser?.avatar || "",
          role: firestoreUser?.role || "user",
          favorites: firestoreUser?.favorites || [],
          bookmarks: firestoreUser?.bookmarks || [],
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  //  Login with email/password (Firebase-only)
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    toast({
      title: "Connexion réussie",
      description: "Bienvenue sur RecettesCloud !",
    });
  };
  

  //  Register new user
  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    const credentials = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = credentials.user.uid;

    await setDoc(doc(db, "users", uid), {
      username,
      email,
      avatar: "",
      role: "user",
      favorites: [],
      bookmarks: [],
      createdAt: new Date(),
    });

    toast({
      title: "Inscription réussie",
      description: "Votre compte a bien été créé !",
    });
  };

  //  Google login (Firebase-only)
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    toast({
      title: "Connecté avec Google",
      description: "Bienvenue !",
    });
  };


  const logout = async () => {
    await signOut(auth);
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté.",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

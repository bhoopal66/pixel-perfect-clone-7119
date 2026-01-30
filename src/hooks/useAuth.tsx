import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'super_admin' | 'admin' | 'supervisor' | 'coordinator' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSupervisor: boolean;
  isCoordinator: boolean;
  userRole: AppRole;
  hasAdminPrivileges: boolean;
  canManageAgents: boolean;
  canManageUsers: boolean;
  canAccessCases: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole>('user');

  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSupervisor = userRole === 'supervisor';
  const isCoordinator = userRole === 'coordinator';
  const hasAdminPrivileges = isAdmin;
  
  // Access control based on role hierarchy
  // super_admin, admin: full access
  // supervisor: cases + agents (no user management)
  // coordinator: cases only
  // user: cases only (basic access)
  const canManageUsers = isAdmin; // Only admin and super_admin
  const canManageAgents = isAdmin || isSupervisor; // Admin, super_admin, supervisor
  const canAccessCases = true; // Everyone can access cases

  const checkUserRole = async (userId: string) => {
    try {
      // Check roles in order of privilege
      const { data: superAdminData } = await supabase.rpc('is_super_admin');
      if (superAdminData === true) {
        setUserRole('super_admin');
        return;
      }

      const { data: adminData } = await supabase.rpc('is_admin');
      if (adminData === true) {
        setUserRole('admin');
        return;
      }

      const { data: supervisorData } = await supabase.rpc('is_supervisor');
      if (supervisorData === true) {
        setUserRole('supervisor');
        return;
      }

      const { data: coordinatorData } = await supabase.rpc('is_coordinator');
      if (coordinatorData === true) {
        setUserRole('coordinator');
        return;
      }

      setUserRole('user');
    } catch (err) {
      console.error('Error checking user role:', err);
      setUserRole('user');
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to prevent potential deadlock with Supabase
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole('user');
        }
        
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRole(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName || '',
          },
        },
      });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      isAdmin, 
      isSuperAdmin,
      isSupervisor,
      isCoordinator,
      userRole, 
      hasAdminPrivileges,
      canManageAgents,
      canManageUsers,
      canAccessCases,
      signUp, 
      signIn, 
      signOut 
    }}>
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

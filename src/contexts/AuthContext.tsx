import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/types/spendo';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  userRole: AppRole | null;
  companyId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check user role - defer to avoid blocking
          setTimeout(async () => {
            await fetchUserRole(session.user.id);
          }, 0);
        } else {
          setIsSuperAdmin(false);
          setUserRole(null);
          setCompanyId(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // First check if superadmin
      const { data: isSuperadmin } = await supabase.rpc('is_superadmin', { _user_id: userId });
      setIsSuperAdmin(!!isSuperadmin);

      // Get profile for company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();
      
      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        
        // Get role in company
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('company_id', profile.company_id)
          .single();
        
        if (roleData) {
          setUserRole(roleData.role as AppRole);
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsSuperAdmin(false);
    setUserRole(null);
    setCompanyId(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isSuperAdmin,
      userRole,
      companyId,
      signOut,
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

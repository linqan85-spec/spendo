import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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
  checkSuperAdmin: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const checkSuperAdmin = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data: isSuperadmin } = await supabase.rpc('is_superadmin', { _user_id: userId });
      setIsSuperAdmin(!!isSuperadmin);
      return !!isSuperadmin;
    } catch (error) {
      console.error('Error checking superadmin:', error);
      return false;
    }
  }, []);

  const fetchUserRole = useCallback(async (userId: string) => {
    setIsRoleLoading(true);
    try {
      // First check if superadmin
      await checkSuperAdmin(userId);

      // Get profile for company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .maybeSingle();
      
      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        
        // Get role in company
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('company_id', profile.company_id)
          .maybeSingle();
        
        if (roleData) {
          setUserRole(roleData.role as AppRole);
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    } finally {
      setIsRoleLoading(false);
    }
  }, [checkSuperAdmin]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch role immediately (not deferred)
          await fetchUserRole(session.user.id);
        } else {
          setIsSuperAdmin(false);
          setUserRole(null);
          setCompanyId(null);
          setIsRoleLoading(false);
        }
        
        setIsAuthLoading(false);
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserRole(session.user.id);
      } else {
        setIsRoleLoading(false);
      }
      
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsSuperAdmin(false);
    setUserRole(null);
    setCompanyId(null);
    // Navigate to login after sign out
    window.location.href = '/login';
  };

  // Combined loading state - true if auth OR role is still loading
  const isLoading = isAuthLoading || (!!user && isRoleLoading);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isSuperAdmin,
      userRole,
      companyId,
      signOut,
      checkSuperAdmin,
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

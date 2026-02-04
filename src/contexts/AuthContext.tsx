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
        .select('company_id, archived_at')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        await supabase.auth.signOut();
        window.location.href = '/login?archived=1';
        return;
      }

      if (profile?.archived_at) {
        await supabase.auth.signOut();
        window.location.href = '/login?archived=1';
        return;
      }
      
      if (profile?.company_id) {
        setCompanyId(profile.company_id);

        const { data: company } = await supabase
          .from('companies')
          .select('archived_at')
          .eq('id', profile.company_id)
          .maybeSingle();

        if (company?.archived_at) {
          await supabase.auth.signOut();
          window.location.href = '/login?archived=1';
          return;
        }
        
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
    let isMounted = true;
    let lastUserId: string | null = null;

    // Listener for ongoing auth changes.
    // IMPORTANT: do NOT await async work here, it can block sign-in flows.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      const nextUserId = nextSession?.user?.id ?? null;

      if (nextUserId) {
        if (nextUserId !== lastUserId) {
          lastUserId = nextUserId;
          void fetchUserRole(nextUserId);
        }
      } else {
        lastUserId = null;
        setIsSuperAdmin(false);
        setUserRole(null);
        setCompanyId(null);
        setIsRoleLoading(false);
      }
    });

    // Initial load controls the global auth loading state.
    const initializeAuth = async () => {
      setIsAuthLoading(true);
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        const initialUserId = initialSession?.user?.id ?? null;
        lastUserId = initialUserId;

        if (initialUserId) {
          await fetchUserRole(initialUserId);
        } else {
          setIsRoleLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setIsRoleLoading(false);
        }
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };

    void initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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

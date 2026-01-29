import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  CreditCard,
  LogOut,
  Shield,
  Eye
} from 'lucide-react';

interface CompanyWithStats {
  id: string;
  name: string;
  org_number: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
  user_count?: number;
}

export default function AdminDashboard() {
  const { user, isSuperAdmin, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeTrials: 0,
    paidCompanies: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (!authLoading && !isSuperAdmin) {
      navigate('/dashboard');
      return;
    }

    if (isSuperAdmin) {
      fetchCompanies();
    }
  }, [user, isSuperAdmin, authLoading, navigate]);

  const fetchCompanies = async () => {
    try {
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user counts per company
      const { data: profiles } = await supabase
        .from('profiles')
        .select('company_id');

      const userCounts = (profiles || []).reduce((acc, profile) => {
        if (profile.company_id) {
          acc[profile.company_id] = (acc[profile.company_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const companiesWithStats = (companiesData || []).map(company => ({
        ...company,
        user_count: userCounts[company.id] || 0,
      }));

      setCompanies(companiesWithStats);

      // Calculate stats
      const activeTrials = companiesWithStats.filter(c => c.subscription_status === 'trialing').length;
      const paidCompanies = companiesWithStats.filter(c => c.subscription_status === 'active').length;
      const totalUsers = Object.values(userCounts).reduce((a, b) => a + b, 0);

      setStats({
        totalCompanies: companiesWithStats.length,
        activeTrials,
        paidCompanies,
        totalUsers,
      });
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr));
  };

  const getDaysRemaining = (trialEndsAt: string | null) => {
    if (!trialEndsAt) return null;
    const diff = new Date(trialEndsAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const getStatusBadge = (status: string, trialEndsAt: string | null) => {
    switch (status) {
      case 'trialing':
        const days = getDaysRemaining(trialEndsAt);
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            Trial ({days} dagar kvar)
          </Badge>
        );
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Aktiv</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Förfallen</Badge>;
      case 'canceled':
        return <Badge variant="secondary">Avslutad</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Spendo Admin</h1>
                <p className="text-sm text-muted-foreground">Superadmin Dashboard</p>
              </div>
            </div>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logga ut
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt företag</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompanies}</div>
              <p className="text-xs text-muted-foreground">Registrerade företag</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktiva trials</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTrials}</div>
              <p className="text-xs text-muted-foreground">14-dagars provperiod</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Betalande</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paidCompanies}</div>
              <p className="text-xs text-muted-foreground">Aktiva prenumerationer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Användare</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Totalt antal användare</p>
            </CardContent>
          </Card>
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Företag</CardTitle>
            <CardDescription>
              Alla registrerade företag och deras status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Inga företag ännu</h3>
                <p className="text-muted-foreground">
                  Företag kommer att visas här när de registrerar sig
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Företag</TableHead>
                    <TableHead>Org.nummer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Användare</TableHead>
                    <TableHead>Registrerad</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {company.org_number || '—'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(company.subscription_status, company.trial_ends_at)}
                      </TableCell>
                      <TableCell>{company.user_count}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(company.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/admin/companies/${company.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Visa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

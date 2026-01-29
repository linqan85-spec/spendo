import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  Building2, 
  Users, 
  Receipt,
  CreditCard,
  Calendar,
  Mail
} from 'lucide-react';

interface CompanyDetail {
  id: string;
  name: string;
  org_number: string | null;
  currency: string;
  subscription_status: string;
  base_price_per_month: number;
  extra_user_price: number;
  max_users_included: number;
  max_manual_expenses: number;
  trial_ends_at: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  role?: string;
}

export default function AdminCompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [expenseCount, setExpenseCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (!authLoading && !isSuperAdmin) {
      navigate('/dashboard');
      return;
    }

    if (isSuperAdmin && companyId) {
      fetchCompanyDetails();
    }
  }, [user, isSuperAdmin, authLoading, companyId, navigate]);

  const fetchCompanyDetails = async () => {
    try {
      // Fetch company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      // Cast to include max_manual_expenses which may not be in generated types yet
      const companyWithDefaults = {
        ...companyData,
        max_manual_expenses: (companyData as unknown as { max_manual_expenses?: number }).max_manual_expenses ?? 20,
      };
      setCompany(companyWithDefaults);

      // Fetch users in company
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyId);

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('company_id', companyId!);

      const roleMap = (roles || []).reduce((acc, r) => {
        acc[r.user_id] = r.role;
        return acc;
      }, {} as Record<string, string>);

      const usersWithRoles = (profiles || []).map(p => ({
        ...p,
        role: roleMap[p.id],
      }));

      setUsers(usersWithRoles);

      // Count expenses
      const { count } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId!);

      setExpenseCount(count || 0);
    } catch (error) {
      console.error('Error fetching company details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateStr));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRoleBadge = (role: string | undefined) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Ägare</Badge>;
      case 'admin':
        return <Badge className="bg-accent text-accent-foreground">Admin</Badge>;
      default:
        return <Badge variant="outline">Medlem</Badge>;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-xl font-semibold">Företaget hittades inte</h2>
          <Button className="mt-4" onClick={() => navigate('/admin')}>
            Tillbaka till admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>

        {/* Company Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="text-muted-foreground">{company.org_number || 'Inget org.nummer'}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-xs text-muted-foreground">Användare</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{expenseCount}</p>
                  <p className="text-xs text-muted-foreground">Kostnader</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(company.base_price_per_month)}</p>
                  <p className="text-xs text-muted-foreground">/månad</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {company.subscription_status === 'trialing' ? 'Trial' : 'Aktiv'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sedan {formatDate(company.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle>Företagsdetaljer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prenumerationsstatus</p>
                <Badge variant="outline" className="mt-1">
                  {company.subscription_status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valuta</p>
                <p className="mt-1">{company.currency}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Grundpris</p>
                <p className="mt-1">{formatCurrency(company.base_price_per_month)}/månad</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Extra användare</p>
                <p className="mt-1">{formatCurrency(company.extra_user_price)}/användare/månad</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Användare inkluderade</p>
                <p className="mt-1">{company.max_users_included}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max manuella utgifter</p>
                <p className="mt-1">{company.max_manual_expenses}</p>
              </div>
              {company.trial_ends_at && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Trial slutar</p>
                  <p className="mt-1">{formatDate(company.trial_ends_at)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Användare</CardTitle>
            <CardDescription>
              Alla användare kopplade till detta företag
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Inga användare</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Roll</TableHead>
                    <TableHead>Registrerad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userProfile) => (
                    <TableRow key={userProfile.id}>
                      <TableCell className="font-medium">
                        {userProfile.name || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {userProfile.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(userProfile.role)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(userProfile.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

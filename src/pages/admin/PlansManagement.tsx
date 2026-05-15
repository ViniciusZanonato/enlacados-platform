import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Users, TrendingUp } from 'lucide-react';

export default function PlansManagement() {
  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price_brl', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: subscriptionStats } = useQuery({
    queryKey: ['admin-subscription-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan, subscription_status');
      if (error) throw error;

      const counts: Record<string, number> = {};
      const activeByPlan: Record<string, number> = {};
      for (const p of data ?? []) {
        counts[p.plan ?? 'free'] = (counts[p.plan ?? 'free'] ?? 0) + 1;
        if (p.subscription_status === 'active') {
          activeByPlan[p.plan ?? 'free'] = (activeByPlan[p.plan ?? 'free'] ?? 0) + 1;
        }
      }
      return { counts, activeByPlan, total: data?.length ?? 0 };
    },
  });

  const activeCount = subscriptionStats
    ? Object.values(subscriptionStats.activeByPlan).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats?.total ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas ativas</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Planos cadastrados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
          </CardContent>
        </Card>
      </div>

      {loadingPlans ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Preço (BRL)</TableHead>
                <TableHead>Stripe Price ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Ativos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan: any) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.display_name ?? plan.name}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{plan.slug}</code></TableCell>
                  <TableCell>
                    {plan.price_brl != null
                      ? `R$ ${Number(plan.price_brl).toFixed(2)}`
                      : <span className="text-muted-foreground">Gratuito</span>}
                  </TableCell>
                  <TableCell>
                    {plan.stripe_price_id
                      ? <code className="text-xs bg-muted px-1 py-0.5 rounded">{plan.stripe_price_id}</code>
                      : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                      {plan.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>{subscriptionStats?.counts[plan.slug] ?? 0}</TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {subscriptionStats?.activeByPlan[plan.slug] ?? 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

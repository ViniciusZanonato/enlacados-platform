import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const ProfileViewsChart = ({ profileId }) => {
  const { data: dailyViews, isLoading, isError, error } = useQuery({
    queryKey: ['dailyProfileViews', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase.rpc('get_daily_profile_views', {
        p_profile_id: profileId,
        p_days: 30,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
    // Add error handling to prevent infinite retries on bad data
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const chartData = useMemo(() => {
    // Safe guard against undefined or malformed data
    if (!dailyViews || !Array.isArray(dailyViews)) return [];

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => {
      // Find view data with type safety
      const viewData = dailyViews.find(v =>
        v && typeof v.view_date === 'string' && v.view_date === date
      );
      return {
        date,
        views: viewData && typeof viewData.count === 'number' ? viewData.count : 0,
      };
    });
  }, [dailyViews]);

  const chartConfig = {
    views: {
      label: "Visualizações",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  // Handle loading state
  if (isLoading) {
    return (
      <Card className="flex items-center justify-center h-[340px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  // Handle error state gracefully
  if (isError) {
    console.error("Erro ao carregar dados de visualizações:", error);
    return (
      <Card className="flex items-center justify-center h-[340px]">
        <p className="text-destructive text-sm">Falha ao carregar dados de visualizações</p>
      </Card>
    );
  }

  // Handle empty data state
  if (!chartData || chartData.length === 0 || chartData.every(d => d.views === 0)) {
    return (
      <Card className="flex items-center justify-center h-[340px]">
        <p className="text-muted-foreground text-sm">Nenhum dado de visualização disponível</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visualizações do Perfil (Últimos 30 Dias)</CardTitle>
      </CardHeader>
      <CardContent>
        {/* ChartContainer with explicit height to avoid Recharts issues */}
        <div className="h-[250px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted"/>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  try {
                    return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                  } catch {
                    return value; // Fallback to raw value if date parsing fails
                  }
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={30}
                allowDecimals={false}
              />
              <Tooltip
                cursor={true}
                content={(props: any) => <ChartTooltipContent indicator="line" {...props} />}
              />
              <Area
                dataKey="views"
                type="monotone"
                fill="url(#colorViews)"
                stroke="var(--color-views)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileViewsChart;

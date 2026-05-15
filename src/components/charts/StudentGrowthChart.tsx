import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const StudentGrowthChart = ({ institutionalProfileId }) => {
  const { data: monthlyGrowth, isLoading, isError, error } = useQuery({
    queryKey: ['monthlyStudentGrowth', institutionalProfileId],
    queryFn: async () => {
      if (!institutionalProfileId) return [];
      const { data, error } = await supabase.rpc('get_monthly_student_growth', {
        p_institutional_profile_id: institutionalProfileId,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!institutionalProfileId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    if (!monthlyGrowth || !Array.isArray(monthlyGrowth)) return [];
    return monthlyGrowth
      .filter(item => item && typeof item.month === 'string' && typeof item.count === 'number')
      .map(item => ({
        month: new Date(item.month).toLocaleString('pt-BR', { month: 'short', year: 'numeric' }),
        students: item.count,
      }))
      .reverse();
  }, [monthlyGrowth]);

  const chartConfig = {
    students: {
      label: "Novos Alunos",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center h-[340px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (isError) {
    console.error("Erro ao carregar crescimento de alunos:", error);
    return (
      <Card className="flex items-center justify-center h-[340px]">
        <p className="text-destructive text-sm">Falha ao carregar dados de crescimento</p>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="flex items-center justify-center h-[340px]">
        <p className="text-muted-foreground text-sm">Nenhum dado de crescimento disponível</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crescimento de Alunos (Mensal)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-students)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-students)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted"/>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} width={30} allowDecimals={false}/>
              <Tooltip
                cursor={true}
                content={(props: any) => <ChartTooltipContent indicator="line" {...props} />}
              />
              <Area
                dataKey="students"
                type="monotone"
                fill="url(#colorStudents)"
                stroke="var(--color-students)"
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

export default StudentGrowthChart;

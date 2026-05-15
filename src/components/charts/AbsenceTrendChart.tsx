import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AcademicHistory } from "@/types/student-journey";

interface AbsenceTrendChartProps {
  data: AcademicHistory[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-lg shadow-xl">
        <p className="font-semibold text-foreground mb-1">{payload[0].payload.course}</p>
        <p className="text-xs text-muted-foreground mb-2">{payload[0].payload.semester}</p>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Faltas:</span>
          <span className="font-bold text-foreground">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const AbsenceTrendChart = ({ data }: AbsenceTrendChartProps) => {
  // Early return with safe fallback
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm min-h-[300px]">
        Sem dados de faltas para exibir
      </div>
    );
  }

  // Safely process data to avoid runtime errors
  const processedData = data
    .filter(item => item && typeof item.semester === 'string')
    .map((item: any) => ({
      name: typeof item.course_name === 'string' ? `${item.semester} - ${item.course_name}` : item.semester,
      absences: typeof item.absences === 'number' ? item.absences : (typeof item.total_absences === 'number' ? item.total_absences : 0),
      semester: item.semester,
      course: item.course_name || "Geral"
    }));

  if (processedData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm min-h-[300px]">
        Nenhum dado válido encontrado para exibição
      </div>
    );
  }

  // Ensure processedData has valid data for Recharts
  const hasValidData = processedData.some(item => item.absences > 0);
  if (!hasValidData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm min-h-[300px]">
        Sem dados de faltas para exibir
      </div>
    );
  }

  return (
    <div className="w-full min-h-[300px] p-2">
      {/* Explicit height container to prevent ResponsiveContainer issues */}
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={false}
              axisLine={false}
              label={{ value: 'Disciplinas', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={CustomTooltip} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
            <Bar
              dataKey="absences"
              fill="hsl(var(--destructive))"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AbsenceTrendChart;

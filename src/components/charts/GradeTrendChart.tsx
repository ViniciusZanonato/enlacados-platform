
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AcademicHistory } from "@/types/student-journey";

interface GradeTrendChartProps {
  data: AcademicHistory[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-lg shadow-xl">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          entry.value > 0 && (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
              <span className="font-medium text-foreground">{entry.value}</span>
            </div>
          )
        ))}
      </div>
    );
  }
  return null;
};

const GradeTrendChart = ({ data }: GradeTrendChartProps) => {
  // Early return with safe fallback
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm min-h-[300px]">
        Sem dados acadêmicos para exibir
      </div>
    );
  }

  // Safely process data to avoid runtime errors
  const dataByCourse = data.reduce((acc, item: any) => {
    // Determine the metric to use (grade or average_grade)
    const grade = typeof item.grade === 'number' ? item.grade : 
                  (typeof item.average_grade === 'number' ? item.average_grade : null);
    
    // Determine the course name (or a fallback for aggregated data)
    const course = typeof item.course_name === 'string' ? item.course_name : 
                  (grade !== null ? "Média Geral" : null);

    // Guard clauses for data integrity
    if (!item || grade === null || !course || !item.semester || typeof item.semester !== 'string') return acc;

    if (!acc[course]) acc[course] = [];
    acc[course].push({ semester: item.semester, grade: grade });
    return acc;
  }, {} as Record<string, { semester: string; grade: number }[]>);

  const courseNames = Object.keys(dataByCourse);
  if (courseNames.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm min-h-[300px]">
        Nenhum dado válido encontrado para exibição
      </div>
    );
  }

  // Create sorted unique semesters list - filter out any null/undefined values
  const semesters = [...new Set(data.map((item) => item.semester).filter((s): s is string => typeof s === 'string'))].sort();

  // Ensure we have valid semesters before creating chart data
  if (semesters.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm min-h-[300px]">
        Sem dados de semestres válidos
      </div>
    );
  }

  const chartData = semesters.map((semester) => {
    const semesterData: { name: string;[key: string]: string | number } = { name: semester };
    for (const courseName in dataByCourse) {
      const courseData = dataByCourse[courseName].find((d) => d.semester === semester);
      // Use 0 for area continuity, but could be null to show gaps
      semesterData[courseName] = courseData?.grade ?? 0;
    }
    return semesterData;
  });

  // Final validation: ensure chartData has at least one item with valid data
  if (chartData.length === 0 || chartData.every(d => Object.keys(d).length <= 1)) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm min-h-[300px]">
        Dados insuficientes para gerar gráfico
      </div>
    );
  }

  const colors = [
    "hsl(var(--primary))",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088FE",
    "#00C49F"
  ];

  return (
    <div className="w-full min-h-[300px] p-2">
      {/* Explicit height container to prevent ResponsiveContainer issues */}
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {courseNames.map((name, index) => (
                <linearGradient key={name} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={CustomTooltip} />
            {courseNames.map((courseName, index) => (
              <Area
                key={courseName}
                type="monotone"
                dataKey={courseName}
                stroke={colors[index % colors.length]}
                fillOpacity={1}
                fill={`url(#color${index})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GradeTrendChart;

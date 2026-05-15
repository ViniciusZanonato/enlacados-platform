import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp, TrendingDown, Lightbulb, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Insight {
    id: string;
    category: string;
    category_display: string;
    priority: string;
    priority_display: string;
    title: string;
    description: string;
    data: any;
    is_read: boolean;
    created_at: string;
}

interface AIInsightsProps {
    insights: Insight[] | undefined;
    isLoading?: boolean;
}

const getIcon = (category: string) => {
    switch (category) {
        case 'nps': return <TrendingUp className="h-5 w-5 text-blue-500" />;
        case 'sentiment': return <MessageSquare className="h-5 w-5 text-purple-500" />;
        case 'trend': return <TrendingUp className="h-5 w-5 text-green-500" />;
        case 'alert': return <AlertCircle className="h-5 w-5 text-red-500" />;
        case 'recommendation': return <Lightbulb className="h-5 w-5 text-yellow-500" />;
        default: return <Lightbulb className="h-5 w-5 text-gray-500" />;
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'critical': return 'destructive';
        case 'high': return 'destructive';
        case 'medium': return 'secondary';
        case 'low': return 'outline';
        default: return 'outline';
    }
};

export const AIInsights = ({ insights, isLoading }: AIInsightsProps) => {
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="h-12 bg-muted rounded-t-lg" />
                        <CardContent className="h-24 bg-muted/50 rounded-b-lg mt-2" />
                    </Card>
                ))}
            </div>
        );
    }

    if (!insights || insights.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10 opacity-60">
                    <Lightbulb className="h-10 w-10 mb-4" />
                    <p>Nenhum insight automático gerado para este período.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">Insights Inteligentes</h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">AI Powered</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {insights.map((insight) => (
                    <Card key={insight.id} className={`overflow-hidden border-l-4 ${insight.priority === 'critical' ? 'border-l-red-600' :
                            insight.priority === 'high' ? 'border-l-orange-500' : 'border-l-blue-400'
                        }`}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                {getIcon(insight.category)}
                                <CardTitle className="text-base font-semibold">{insight.title}</CardTitle>
                            </div>
                            <Badge variant={getPriorityColor(insight.priority) as any}>
                                {insight.priority_display}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                {insight.description}
                            </p>
                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true, locale: ptBR })}
                                </span>
                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                                    {insight.category_display}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

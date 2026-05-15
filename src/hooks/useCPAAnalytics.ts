import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as cpaApi from '@/features/cpa/api';
import { toast } from 'sonner';

//==========================
// Título : Hook — analytics CPA (Vercel + tabela cpa_analytics)
//==========================

export const useCPAAnalytics = (questionnaireId: string | undefined) => {
    const queryClient = useQueryClient();

    const analyticsQuery = useQuery({
        queryKey: ['cpaAnalytics', questionnaireId],
        queryFn: () => cpaApi.getCPAAnalytics(questionnaireId!),
        enabled: !!questionnaireId,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const refreshAnalyticsMutation = useMutation({
        mutationFn: () => cpaApi.refreshAllStaleMetrics(), // [S5-002] Lara: Usa a RPC global de refresh
        onSuccess: () => {
            toast.success('Processamento de métricas obsoletas iniciado!');
            // Invalida a query após um pequeno delay para dar tempo ao worker do banco
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['cpaAnalytics', questionnaireId] });
            }, 3000);
        },
        onError: (error: Error) => {
            toast.error(`Falha ao processar dados: ${error.message}`);
        },
    });

    return {
        analytics: analyticsQuery.data,
        isLoading: analyticsQuery.isLoading,
        error: analyticsQuery.error,
        isRefetching: analyticsQuery.isRefetching,
        refresh: () => refreshAnalyticsMutation.mutate(),
        isRefreshing: refreshAnalyticsMutation.isPending,
    };
};

import { useState } from 'react';
import { FileText, FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { exportQuestionnaireResponsesXlsx } from '@/lib/cpa-export-xlsx';

//==========================
// Título : Exportação rápida — XLSX via RPC; PDF orienta impressão do navegador
//==========================

interface ReportExportButtonsProps {
    questionnaireId: string;
    questionnaireTitle: string;
}

export function ReportExportButtons({ questionnaireId, questionnaireTitle }: ReportExportButtonsProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            await exportQuestionnaireResponsesXlsx(questionnaireId, questionnaireTitle);
            toast.success('Planilha exportada com sucesso.');
        } catch (e: unknown) {
            const msg = e instanceof Error && e.message === 'EMPTY'
                ? 'Nenhuma resposta para exportar.'
                : 'Não foi possível exportar a planilha.';
            if (e instanceof Error && e.message !== 'EMPTY') {
                console.error('[ReportExportButtons] XLSX:', e);
            }
            toast.error(msg);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPdfHint = () => {
        toast.info(
            'Para PDF, use Imprimir (Ctrl+P) nesta página de resultados e escolha "Salvar como PDF".',
            { duration: 8000 },
        );
    };

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-9 border-primary/20 hover:border-primary/50">
                        <Download className="h-4 w-4 text-primary" />
                        <span>Exportar Relatório</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Exportar
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleExportPdfHint} disabled={isExporting}>
                        <FileText className="h-4 w-4 mr-2 text-red-500" />
                        <span>Resumo em PDF (via navegador)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            void handleExportExcel();
                        }}
                        disabled={isExporting}
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                        <span>Dados em Excel</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

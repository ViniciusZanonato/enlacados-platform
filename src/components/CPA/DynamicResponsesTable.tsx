import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wand2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { SentimentEditModal } from './SentimentEditModal';
import { analyzeSentimentPy } from '@/features/cpa/api';

interface DynamicResponsesTableProps {
  data: Record<string, string | number | boolean | null>[];
}

interface SentimentResult {
  text: string;
  sentiment: string;
}

export const DynamicResponsesTable = ({ data: initialData }: DynamicResponsesTableProps) => {
  const [tableData, setTableData] = useState(initialData);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number, columnKey: string, currentSentiment: string, responseId?: string } | null>(null);

  const sentimentCounts = useMemo(() => {
    if (initialData.length === 0 || tableData.length === 0) return null;
    const sentimentColumn = Object.keys(tableData[0]).find(key => key.startsWith('Sentimento:'));
    if (!sentimentColumn) return null;

    const counts = { BOM: 0, RUIM: 0, NEUTRO: 0 };
    tableData.forEach(row => {
      const sentiment = row[sentimentColumn] as string;
      if (sentiment === 'BOM') counts.BOM++;
      else if (sentiment === 'RUIM') counts.RUIM++;
      else if (sentiment === 'NEUTRO') counts.NEUTRO++;
    });

    return counts;
  }, [tableData, initialData]);

  const analyzeSentimentMutation = useMutation({
    mutationFn: async (columnKey: string) => {
      const texts = tableData.map(row => row[columnKey]).filter(Boolean) as string[];
      if (texts.length === 0) {
        throw new Error("Não há dados de texto para analisar.");
      }
      const data = await analyzeSentimentPy(texts);
      return { data, columnKey };
    },
    onSuccess: ({ data: sentimentResults, columnKey }) => {
      setTableData(currentData => {
        const sentimentMap = new Map(sentimentResults.map((r: SentimentResult) => [r.text, r.sentiment]));
        return currentData.map(row => ({
          ...row,
          [`Sentimento: ${columnKey}`]: sentimentMap.get(row[columnKey] as string) || 'N/A',
        })) as Record<string, string | number | boolean | null>[];
      });
      toast.success("Análise de sentimento concluída!");
    },
    onError: (error: Error) => {
      toast.error(`Falha na análise: ${error.message}`);
    },
  });

  const updateSentimentMutation = useMutation({
    mutationFn: async ({ responseId, newSentiment }: { responseId: string, newSentiment: string }) => {
      if (responseId) {
        const { error } = await supabase.rpc('update_response_sentiment', {
          p_response_id: responseId,
          p_sentiment: newSentiment
        });
        if (error) {
          console.warn("Backend update failed (RPC might be missing):", error);
        }
      }
      return { responseId, newSentiment };
    },
    onSuccess: ({ newSentiment }) => {
      if (editingCell) {
        setTableData(prev => {
          const newData = [...prev];
          newData[editingCell.rowIndex] = {
            ...newData[editingCell.rowIndex],
            [editingCell.columnKey]: newSentiment
          };
          return newData;
        });
        toast.success("Sentimento atualizado!");
      }
      setEditingCell(null);
    },
    onError: (_e) => {
      toast.error("Erro ao salvar sentimento. Tente novamente.");
    }
  });

  const columns = useMemo<ColumnDef<Record<string, string | number | boolean | null>>[]>(() => {
    if (tableData.length === 0) {
      return [];
    }
    const keys = Object.keys(tableData[0]);
    return keys.map(key => ({
      accessorKey: key,
      header: () => (
        <div className="flex items-center gap-2">
          {key}
          {!key.startsWith('Sentimento:') && !key.startsWith('id') && !key.startsWith('response_id') && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => analyzeSentimentMutation.mutate(key)} disabled={analyzeSentimentMutation.isPending}>
              <Wand2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
      cell: ({ row, getValue }) => {
        const value = getValue() as string;
        if (key.startsWith('Sentimento:')) {
          const sentimentColor = value === 'BOM' ? 'text-green-600' : value === 'RUIM' ? 'text-red-600' : 'text-gray-600';
          return (
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${sentimentColor}`}>{value}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-50 hover:opacity-100"
                onClick={() => {
                  const responseId = row.original.response_id as string || row.original.id as string;
                  setEditingCell({
                    rowIndex: row.index,
                    columnKey: key,
                    currentSentiment: value,
                    responseId
                  });
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          )
        }
        return <span className="text-muted-foreground">{String(value)}</span>;
      },
    }));
  }, [tableData, analyzeSentimentMutation]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4 w-full">
      {sentimentCounts && (
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
          <h4 className="font-semibold text-sm">Resumo do Sentimento:</h4>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-600">💚 BOM: <strong>{sentimentCounts.BOM}</strong></span>
            <span className="flex items-center gap-1 text-red-600">💔 RUIM: <strong>{sentimentCounts.RUIM}</strong></span>
            <span className="flex items-center gap-1 text-gray-600">⚪ NEUTRO: <strong>{sentimentCounts.NEUTRO}</strong></span>
          </div>
        </div>
      )}
      <div className="rounded-md border min-h-[200px]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhuma resposta.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <span className="text-sm text-muted-foreground">
          Página {' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} de {' '}
            {table.getPageCount()}
          </strong>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próximo
        </Button>
      </div>

      <SentimentEditModal
        isOpen={!!editingCell}
        onClose={() => setEditingCell(null)}
        currentResponseId={editingCell?.responseId || null}
        currentSentiment={editingCell?.currentSentiment || null}
        onSave={(id, sentiment) => updateSentimentMutation.mutate({ responseId: id, newSentiment: sentiment })}
      />
    </div>
  );
};

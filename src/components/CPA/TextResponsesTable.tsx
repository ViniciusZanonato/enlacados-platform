import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pen } from 'lucide-react';

interface TextResponse {
  id: string;
  answer: string;
  sentiment: string;
}

interface TextResponsesTableProps {
  data: TextResponse[];
  onEditSentiment: (responseId: string, currentSentiment: string) => void;
}

export const TextResponsesTable = ({ data, onEditSentiment }: TextResponsesTableProps) => {
  const columns = useMemo<ColumnDef<TextResponse>[]>(() => [
    {
      accessorKey: 'answer',
      header: 'Respostas',
      cell: info => <span className="text-muted-foreground">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'sentiment',
      header: 'Sentimento',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{row.original.sentiment}</span>
          <Button variant="ghost" size="icon" onClick={() => onEditSentiment(row.original.id, row.original.sentiment)}>
            <Pen className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [onEditSentiment]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5, // Show 5 rows per page
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
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
    </div>
  );
};
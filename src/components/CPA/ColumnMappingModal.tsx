
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { fillableFields } from '@/data/formFields';
import { autoDetectColumnTypes } from '@/lib/question-type-detector';

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (mappedData: Array<Record<string, unknown>>) => void;
  sheetData: Array<Record<string, unknown>>;
}

export const ColumnMappingModal = ({ isOpen, onClose, onImport, sheetData }: ColumnMappingModalProps) => {
  const [columnMappings, setColumnMappings] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (sheetData.length > 0) {
      const detectedTypes = autoDetectColumnTypes(sheetData);
      setColumnMappings(detectedTypes);
    }
  }, [sheetData]);

  const headers = sheetData.length > 0 ? Object.keys(sheetData[0]) : [];

  const handleMappingChange = (column: string, type: string) => {
    setColumnMappings(prev => ({ ...prev, [column]: type }));
  };

interface MappedRow {
  [key: string]: {
    question_text: string;
    question_type: string;
    answer_text: unknown;
  };
}

// ...

  const handleImport = () => {
    const mappedData = sheetData.map(row => {
      const newRow: MappedRow = {};
      for (const header of headers) {
        const questionType = columnMappings[header];
        if (questionType) {
          newRow[header] = {
            question_text: header,
            question_type: questionType,
            answer_text: row[header],
          };
        }
      }
      return newRow;
    });
    onImport(mappedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Mapeamento de Colunas</DialogTitle>
          <DialogDescription>
            Selecione o tipo de pergunta para cada coluna da sua planilha. Nós sugerimos um tipo, mas você pode alterá-lo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {headers.map(header => (
            <div key={header} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={header} className="text-right">
                {header}
              </Label>
              <Select
                defaultValue={columnMappings[header]}
                onValueChange={(value) => handleMappingChange(header, value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um tipo de pergunta" />
                </SelectTrigger>
                <SelectContent>
                  {fillableFields.map(field => (
                    <SelectItem key={field.type} value={field.type}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleImport}>Importar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

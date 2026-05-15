import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/api/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, Upload, Table as TableIcon, CheckCircle2, AlertCircle, Trash2, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

type ImportType = 'STUDENTS' | 'FINANCE' | 'ACADEMIC';

interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  description: string;
  example: any;
}

const FIELD_DEFINITIONS: Record<ImportType, (FieldDefinition & { category?: string })[]> = {
  STUDENTS: [
    // ESSENTIAL
    { key: 'full_name', label: 'Nome Completo', required: true, description: 'Nome do aluno para cadastro', example: 'João da Silva Santos', category: 'Essencial' },
    { key: 'email', label: 'E-mail', required: true, description: 'E-mail para convite e login', example: 'joao.silva@exemplo.com', category: 'Essencial' },
    { key: 'cpf', label: 'CPF', required: true, description: 'CPF para identificação única', example: '12345678901', category: 'Essencial' },
    
    // PERSONAL
    { key: 'rg', label: 'RG', required: false, description: 'Documento de identidade', example: '12.345.678-9', category: 'Pessoal' },
    { key: 'date_of_birth', label: 'Data de Nascimento', required: false, description: 'Formato: AAAA-MM-DD', example: '2005-03-15', category: 'Pessoal' },
    { key: 'gender', label: 'Sexo', required: false, description: 'Masculino, Feminino, Outro', example: 'Masculino', category: 'Pessoal' },
    { key: 'phone_number', label: 'Telefone', required: false, description: 'Com DDD', example: '11988887777', category: 'Pessoal' },
    { key: 'marital_status', label: 'Estado Civil', required: false, description: 'Solteiro, Casado, etc.', example: 'Solteiro', category: 'Pessoal' },
    { key: 'birth_city', label: 'Cidade Natal', required: false, description: 'Cidade de nascimento', example: 'São Paulo', category: 'Pessoal' },
    { key: 'nationality', label: 'Nacionalidade', required: false, description: 'País de origem', example: 'Brasileira', category: 'Pessoal' },
    
    // ADDRESS
    { key: 'street_address', label: 'Endereço/Rua', required: false, description: 'Logradouro e número', example: 'Rua das Flores, 123', category: 'Endereço' },
    { key: 'neighborhood', label: 'Bairro', required: false, description: 'Bairro de residência', example: 'Centro', category: 'Endereço' },
    { key: 'current_city', label: 'Cidade Atual', required: false, description: 'Cidade onde reside', example: 'São Caetano do Sul', category: 'Endereço' },
    { key: 'zip_code', label: 'CEP', required: false, description: 'Somente números', example: '01234567', category: 'Endereço' },

    // ACADEMIC
    { key: 'registration_number', label: 'Matrícula (RA)', required: false, description: 'Número de registro interno', example: '20240001', category: 'Acadêmico' },
    { key: 'class_name', label: 'Nome da Turma', required: false, description: 'Turma de destino', example: '3º Ano - Manhã', category: 'Acadêmico' },
    { key: 'academic_status', label: 'Status Acadêmico', required: false, description: 'Ativo, Trancado, etc.', example: 'Ativo', category: 'Acadêmico' },
    { key: 'shift', label: 'Turno', required: false, description: 'Matutino, Noturno, etc.', example: 'Matutino', category: 'Acadêmico' },
    { key: 'entry_date', label: 'Data de Ingresso', required: false, description: 'Data de início na escola', example: '2024-02-01', category: 'Acadêmico' },
    { key: 'entry_method', label: 'Método de Ingresso', required: false, description: 'Vestibular, Transferência, etc.', example: 'Vestibular', category: 'Acadêmico' },
    { key: 'gpa', label: 'GPA (CR)', required: false, description: 'Média global atual', example: 8.5, category: 'Acadêmico' },
    { key: 'semester', label: 'Semestre', required: false, description: 'Ex: 2024/1', example: '2024/1', category: 'Acadêmico' },
  ],
  FINANCE: [
    { key: 'student_cpf', label: 'CPF do Aluno', required: true, description: 'CPF do aluno dono do boleto', example: '12345678901' },
    { key: 'type', label: 'Tipo', required: true, description: 'invoice, payment, fine, scholarship', example: 'invoice' },
    { key: 'amount', label: 'Valor', required: true, description: 'Valor da transação (Ex: 150.50)', example: 450.80 },
    { key: 'due_date', label: 'Data de Vencimento', required: true, description: 'Data limite para pagamento', example: '2025-05-10' },
    { key: 'status', label: 'Status', required: true, description: 'pending, paid, overdue', example: 'pending' },
    { key: 'description', label: 'Descrição', required: false, description: 'Descrição da cobrança', example: 'Mensalidade Escolar - Maio' },
  ],
  ACADEMIC: [
    { key: 'student_cpf', label: 'CPF do Aluno', required: true, description: 'CPF do aluno', example: '12345678901' },
    { key: 'class_name', label: 'Nome da Turma', required: true, description: 'Turma da disciplina', example: 'Matemática Avançada' },
    { key: 'grade', label: 'Nota', required: false, description: 'Nota final ou da etapa', example: 8.5 },
    { key: 'absences', label: 'Faltas', required: false, description: 'Total de faltas acumuladas', example: 2 },
    { key: 'semester', label: 'Semestre', required: false, description: 'Vigência do dado', example: '2025/1' },
  ]
};

const SmartBulkImport = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'selection' | 'mapping' | 'processing' | 'success'>('selection');
  const [importType, setImportType] = useState<ImportType>('STUDENTS');
  const [fileData, setFileData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    try {
      // 1. Prepare example row
      const templateRow: any = {};
      const fields = FIELD_DEFINITIONS[importType];
      
      // Map labels as headers and use example values
      fields.forEach(f => {
        templateRow[f.label] = f.example || '';
      });

      // 2. Create workbook
      const ws = XLSX.utils.json_to_sheet([templateRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Modelo");

      // 3. Export
      const fileName = `modelo_importacao_${importType.toLowerCase()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Modelo de exemplo baixado com sucesso!');
    } catch (err) {
      console.error('Error generating template:', err);
      toast.error('Ocorreu um erro ao gerar o modelo.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
          toast.error('O arquivo está vazio.', { duration: 8000 });
          setIsLoading(false);
          return;
        }

        setFileData(data);
        setHeaders(Object.keys(data[0] as object));
        
        // Auto-guess mappings
        const initialMappings: Record<string, string> = {};
        const systemFields = FIELD_DEFINITIONS[importType];
        const fileHeaders = Object.keys(data[0] as object);

        systemFields.forEach(field => {
          const match = fileHeaders.find(h => 
            h.toLowerCase().includes(field.key.toLowerCase()) || 
            h.toLowerCase().includes(field.label.toLowerCase())
          );
          if (match) initialMappings[field.key] = match;
        });

        setMappings(initialMappings);
        setStep('mapping');
      } catch (err) {
        console.error('Error parsing file:', err);
        toast.error('Erro ao ler o arquivo. Certifique-se que é um XLSX ou CSV válido.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    // Validate required mappings
    const missingFields = FIELD_DEFINITIONS[importType]
      .filter(f => f.required && !mappings[f.key])
      .map(f => f.label);

    if (missingFields.length > 0) {
      toast.error(`Campos obrigatórios não mapeados: ${missingFields.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setStep('processing');
    setProgress(10);

    try {
      // 1. Get institutional_profile_id
      const { data: instData, error: instError } = await supabase
        .from('institutional_profiles')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (instError || !instData) throw new Error('Não foi possível identificar seu perfil institucional.');

      // 2. Prepare data for RPC
      const processedRows = fileData.map(row => {
        const mappedRow: any = {};
        Object.entries(mappings).forEach(([systemKey, fileKey]) => {
          mappedRow[systemKey] = row[fileKey];
        });
        return mappedRow;
      });

      // 3. Call Modular RPC
      let rpcName = '';
      if (importType === 'STUDENTS') rpcName = 'smart_import_students';
      if (importType === 'FINANCE') rpcName = 'smart_import_finance';
      if (importType === 'ACADEMIC') rpcName = 'smart_import_academic';

      const { data: result, error: rpcError } = await supabase.rpc(rpcName, {
        p_institution_id: instData.id,
        p_rows: processedRows
      });

      if (rpcError) throw rpcError;

      setProgress(100);
      setStep('success');
      toast.success('Importação concluída com sucesso!');
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(`Erro na importação: ${err.message}`);
      setStep('mapping');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep('selection');
    setFileData([]);
    setMappings({});
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <Card className="border-2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Importador Inteligente ERP</CardTitle>
              <CardDescription>Traga dados do TOTVS, Sponte ou outros sistemas de forma modular</CardDescription>
            </div>
            {step !== 'selection' && (
              <Button variant="ghost" size="sm" onClick={reset}>
                Reiniciar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'selection' && (
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label>O que você deseja importar agora?</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['STUDENTS', 'FINANCE', 'ACADEMIC'] as ImportType[]).map((type) => (
                    <div
                      key={type}
                      onClick={() => setImportType(type)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        importType === type ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-muted hover:border-border'
                      }`}
                    >
                      <h3 className="font-bold">{type === 'STUDENTS' ? 'Alunos & Turmas' : type === 'FINANCE' ? 'Financeiro' : 'Histórico Acadêmico'}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {type === 'STUDENTS' ? 'Cria usuários, turmas e vínculos.' : type === 'FINANCE' ? 'Importa boletos e pagamentos.' : 'Importa notas e faltas.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadTemplate}
                  className="text-xs flex items-center gap-2 border-dashed border-primary/40 hover:border-primary transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Baixar Modelo de Exemplo (XLSX)
                </Button>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".xlsx,.xls,.csv" 
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">Clique para selecionar o arquivo</h3>
                <p className="text-sm text-muted-foreground mt-2">Arraste seu Excel (XLSX) ou CSV aqui para começar o mapeamento</p>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-muted/30 p-4 rounded-lg border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TableIcon className="text-primary h-5 w-5" />
                  <div>
                    <p className="font-medium">Arquivo pronto: {fileData.length} registros detectados</p>
                    <p className="text-xs text-muted-foreground">Mapeie as colunas abaixo para processar</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                    Mapear Colunas
                  </h3>
                  
                  <div className="space-y-8">
                    {Array.from(new Set(FIELD_DEFINITIONS[importType].map(f => f.category || 'Outros'))).map(category => (
                      <div key={category} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="px-2 py-0 text-[10px] uppercase font-bold tracking-wider opacity-70">
                            {category}
                          </Badge>
                          <div className="h-[1px] bg-border flex-grow" />
                        </div>
                        
                        <div className="grid gap-4">
                          {FIELD_DEFINITIONS[importType]
                            .filter(f => (f.category || 'Outros') === category)
                            .map((field) => (
                              <div key={field.key} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <Label className="flex items-center gap-1">
                                    {field.label}
                                    {field.required && <span className="text-destructive">*</span>}
                                  </Label>
                                  <span className="text-[10px] text-muted-foreground uppercase opacity-50">{field.description}</span>
                                </div>
                                <Select 
                                  value={mappings[field.key] || ''} 
                                  onValueChange={(val) => setMappings(prev => ({ ...prev, [field.key]: val }))}
                                >
                                  <SelectTrigger className={!mappings[field.key] && field.required ? 'border-destructive/50' : ''}>
                                    <SelectValue placeholder="Selecione a coluna no Excel" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {headers.map((header) => (
                                      <SelectItem key={header} value={header}>{header}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    Prévia dos Dados
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          {headers.slice(0, 3).map(h => <TableHead key={h} className="text-[10px]">{h}</TableHead>)}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fileData.slice(0, 5).map((row, i) => (
                          <TableRow key={i}>
                            {headers.slice(0, 3).map(h => <TableCell key={h} className="text-[10px] truncate max-w-[100px]">{String(row[h])}</TableCell>)}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground italic">Mostrando as primeiras 5 linhas de {fileData.length}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setStep('selection')}>Voltar</Button>
                <Button onClick={handleImport} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar e Processar
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-20 text-center space-y-6">
              <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-bold">Processando dados...</h3>
                <p className="text-muted-foreground text-sm">Estamos criando as turmas, usuários e orquestrando o seu portal. Isso pode levar alguns segundos.</p>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-20 text-center space-y-6 animate-in zoom-in duration-300">
              <div className="bg-green-100 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4 border-green-500">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Importação Finalizada!</h3>
                <p className="text-muted-foreground">O sistema orquestrou com sucesso os dados do seu ERP.</p>
              </div>
              <div className="flex justify-center gap-4">
                <Button onClick={reset}>Fazer Outra Importação</Button>
                <Button variant="outline" onClick={() => navigate('/portal/students')}>Ver Alunos</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg flex gap-4">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-800 dark:text-blue-300"><strong>Privacidade</strong>: O CPF é processado com hash seguro assim que entra no sistema.</p>
        </div>
        <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-lg flex gap-4">
          <TableIcon className="h-5 w-5 text-orange-600 shrink-0" />
          <p className="text-xs text-orange-800 dark:text-orange-300"><strong>Automação</strong>: Turmas novas são detectadas e criadas em tempo real durante a importação.</p>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-lg flex gap-4">
          <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0" />
          <p className="text-xs text-purple-800 dark:text-purple-300"><strong>Versatilidade</strong>: Use arquivos segmentados ou completos do TOTVS RM.</p>
        </div>
      </div>
    </div>
  );
};

export default SmartBulkImport;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { useStudentDocuments, useUploadStudentDocument, StudentDocument } from '@/hooks/useStudentDocuments';
import { useStudentContext } from '@/contexts/StudentContext';

const statusIcon = {
  pending_validation: <FileText className="h-5 w-5 text-yellow-500" />,
  validated: <CheckCircle className="h-5 w-5 text-green-500" />,
  rejected: <XCircle className="h-5 w-5 text-destructive" />,
}

const DocumentsTab = () => {
  const { studentProfileId, institutionalProfileId } = useStudentContext();
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');

  const { data: documents, isLoading, isError } = useStudentDocuments(studentProfileId);
  const uploadDocumentMutation = useUploadStudentDocument(studentProfileId, institutionalProfileId);

  const handleUpload = async () => {
    if (!file || !documentType) {
      toast.error('Por favor, selecione um arquivo e um tipo de documento.');
      return;
    }
    uploadDocumentMutation.mutate({ file, documentType });
    setFile(null); // Clear file input
    setDocumentType(''); // Clear document type input
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (isError) {
    return <p className="text-center text-destructive">Erro ao carregar documentos.</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enviar Novo Documento</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="doc-type">Tipo de Documento</Label>
            <Input 
              id="doc-type" 
              placeholder="Ex: RG, CPF, Comprovante de Residência"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="doc-file">Arquivo</Label>
            <Input 
              id="doc-file" 
              type="file" 
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              key={file?.name || "no-file"} // Reset input when file is cleared
            />
          </div>
          <Button onClick={handleUpload} disabled={uploadDocumentMutation.isPending || !documentType || !file}>
            {uploadDocumentMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Enviar
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Documentos Enviados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents && documents.length > 0 ? documents.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.document_type}</TableCell>
                  <TableCell>{format(new Date(doc.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center gap-2">
                        {statusIcon[doc.status]}
                        <span className="capitalize">{doc.status.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc.rejection_reason || 'N/A'}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">Nenhum documento enviado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsTab;
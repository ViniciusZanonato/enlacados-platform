
import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';

interface PDFReportExportProps {
    students: any[];
    title: string;
}

export const PDFReportExport = ({ students, title }: PDFReportExportProps) => {
    const handleExport = () => {
        try {
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text(title, 14, 22);
            doc.setFontSize(11);
            doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 30);

            const tableColumn = ["Nome", "CPF", "Curso", "Status"];
            const tableRows = [];

            students.forEach((student) => {
                const studentData = [
                    student.full_name,
                    student.cpf,
                    student.course_name || 'N/A', // Assuming course_name might be added or inferred
                    student.status === 'active' ? 'Ativo' : 'Pendente',
                ];
                tableRows.push(studentData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                styles: { fontSize: 10 },
                headStyles: { fillColor: [22, 163, 74] }, // Greenish
            });

            doc.save(`relatorio_alunos_${new Date().toISOString().slice(0, 10)}.pdf`);
            toast.success('Relatório PDF gerado com sucesso!');
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error('Erro ao gerar relatório PDF.');
        }
    };

    return (
        <Button variant="outline" onClick={handleExport} disabled={students.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar Relatório
        </Button>
    );
};

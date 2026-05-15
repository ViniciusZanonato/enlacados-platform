import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, CheckCircle, XCircle } from 'lucide-react';

// Mock data - In a real scenario, this would come from the database
const coursesMock = [
  { id: 'cs101', name: 'Algoritmos e Estrutura de Dados', passingGrade: 7, assessments: [
    { name: 'Prova 1', weight: 4 },
    { name: 'Trabalho 1', weight: 2 },
    { name: 'Prova 2', weight: 4 },
  ]},
  { id: 'ma202', name: 'Cálculo II', passingGrade: 6, assessments: [
    { name: 'Atividade Online', weight: 2 },
    { name: 'Prova Intermediária', weight: 3 },
    { name: 'Prova Final', weight: 5 },
  ]},
];

const GradeSimulatorTab = () => {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [grades, setGrades] = useState<{ [key: string]: number | null }>({});

  const selectedCourse = useMemo(() => {
    return coursesMock.find(c => c.id === selectedCourseId);
  }, [selectedCourseId]);

  const handleGradeChange = (assessmentName: string, value: string) => {
    const numericValue = value === '' ? null : parseFloat(value);
    setGrades(prev => ({ ...prev, [assessmentName]: numericValue }));
  };

  const finalGrade = useMemo(() => {
    if (!selectedCourse) return null;
    
    let totalGrade = 0;
    let totalWeight = 0;

    for (const assessment of selectedCourse.assessments) {
        const grade = grades[assessment.name];
        if (grade !== null && grade !== undefined) {
            totalGrade += grade * assessment.weight;
            totalWeight += assessment.weight;
        }
    }

    if (totalWeight === 0) return null;
    
    // Extrapolate grade if not all weights are filled
    const fullCourseWeight = selectedCourse.assessments.reduce((acc, a) => acc + a.weight, 0);
    return (totalGrade / totalWeight) * (fullCourseWeight / fullCourseWeight); // Simplified for now

  }, [selectedCourse, grades]);

  const isApproved = useMemo(() => {
    if (!finalGrade || !selectedCourse) return null;
    return finalGrade >= selectedCourse.passingGrade;
  }, [finalGrade, selectedCourse]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simulador de Notas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Selecione a Disciplina</Label>
            <Select onValueChange={setSelectedCourseId} value={selectedCourseId || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma disciplina para simular..." />
              </SelectTrigger>
              <SelectContent>
                {coursesMock.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourse && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Insira suas notas (atuais ou hipotéticas):</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedCourse.assessments.map(assessment => (
                  <div key={assessment.name} className="grid gap-1.5">
                    <Label htmlFor={`grade-${assessment.name}`}>{assessment.name} (Peso {assessment.weight})</Label>
                    <Input
                      id={`grade-${assessment.name}`}
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      placeholder="Nota de 0 a 10"
                      value={grades[assessment.name] ?? ''}
                      onChange={(e) => handleGradeChange(assessment.name, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              {finalGrade !== null && (
                <Alert className={isApproved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                    {isApproved ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <AlertTitle>Resultado da Simulação</AlertTitle>
                    <AlertDescription>
                        Sua média final calculada é <strong>{finalGrade.toFixed(2)}</strong>.
                        Com esta média, você estaria <strong>{isApproved ? 'Aprovado(a)' : 'Reprovado(a)'}</strong>.
                        (Média para aprovação: {selectedCourse.passingGrade})
                    </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
       <Alert variant="default">
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Sobre o Simulador</AlertTitle>
          <AlertDescription>
            Este é um modelo de simulação. As regras de avaliação e pesos das disciplinas são exemplos e podem não refletir a realidade. Em uma versão futura, estes dados virão diretamente do seu plano de curso.
          </AlertDescription>
        </Alert>
    </div>
  );
};

export default GradeSimulatorTab;

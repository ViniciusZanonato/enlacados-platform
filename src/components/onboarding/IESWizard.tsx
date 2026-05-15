import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const IESWizard: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bem-vindo ao Enlaçados (Wizard IES)</CardTitle>
        <CardDescription>Vamos configurar sua instituição em poucos passos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-md bg-muted/50">
          <p className="text-sm font-medium">Passo 1: Informações Básicas</p>
          <p className="text-xs text-muted-foreground">Preencha os dados da sua instituição.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline">Pular</Button>
          <Button>Continuar</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default IESWizard;

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Users, FileText, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CPACommissionManagement from "@/components/CPACommissionManagement";
import CPAAxesAndDimensions from "@/components/CPAAxesAndDimensions";
import CPAQuestionnaireManagement from "@/components/CPAQuestionnaireManagement";
import ReportGenerator from "@/components/CPA/ReportGenerator";

const CPA = () => {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/portal')}
          className="h-9 w-9 border-border/60 hover:border-primary/50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="label-pill text-primary/70 block mb-1">Avaliação institucional</span>
          <h1 className="text-4xl leading-none">Gestão da CPA</h1>
        </div>
      </div>

      <Tabs defaultValue="commission" className="w-full">
        <TabsList className="bg-muted/50 border border-border/50 p-1 h-auto gap-1">
          <TabsTrigger value="commission" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:border data-[state=active]:border-border/60 data-[state=active]:shadow-sm rounded-md px-4 py-2">
            <Users className="h-3.5 w-3.5" />
            <span>Comissão</span>
          </TabsTrigger>
          <TabsTrigger value="axes" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:border data-[state=active]:border-border/60 data-[state=active]:shadow-sm rounded-md px-4 py-2">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Eixos e Dimensões</span>
          </TabsTrigger>
          <TabsTrigger value="questionnaires" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:border data-[state=active]:border-border/60 data-[state=active]:shadow-sm rounded-md px-4 py-2">
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Questionários</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:border data-[state=active]:border-border/60 data-[state=active]:shadow-sm rounded-md px-4 py-2">
            <FileText className="h-3.5 w-3.5" />
            <span>Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="commission"><CPACommissionManagement /></TabsContent>
          <TabsContent value="axes"><CPAAxesAndDimensions /></TabsContent>
          <TabsContent value="questionnaires"><CPAQuestionnaireManagement /></TabsContent>
          <TabsContent value="reports"><ReportGenerator /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default CPA;

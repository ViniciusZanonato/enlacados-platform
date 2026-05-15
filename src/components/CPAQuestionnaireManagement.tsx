import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/api/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus, Edit, Trash2, CalendarIcon, ClipboardList, BarChart3, ClipboardPlus, Upload } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { questionnaireTemplates } from "@/data/questionnaireTemplates";
import { handleSupabaseError } from "@/lib/supabase-error-handler";
import { QuestionData } from '@/components/QuestionEditorModal';
import * as XLSX from '@/lib/xlsx.mjs';
import { ColumnMappingModal } from '@/components/CPA/ColumnMappingModal';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const questionnaireSchema = z.object({
  title: z.string().min(1, "O título é obrigatório."),
  description: z.string().optional(),
  target_audience: z.string().min(1, "O público-alvo é obrigatório."),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  status: z.string().min(1, "O status é obrigatório."),
  institutional_profile_id: z.string().min(1, "A instituição é obrigatória."),
  commission_id: z.string().min(1, "A comissão é obrigatória."),
  course_id: z.string().optional(),
  templateId: z.string().optional(),
});

type QuestionnaireFormValues = z.infer<typeof questionnaireSchema>;

interface Questionnaire {
  id: string;
  institutional_profile_id: string;
  commission_id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  target_audience: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  course?: { name: string };
}

interface InstitutionalProfile {
  id: string;
  profile_id: string;
  institution_name: string;
}

interface Course {
  id: string;
  name: string;
}

interface Commission {
  id: string;
  start_date: string | null;
  end_date: string | null;
}

interface QuestionnaireTemplate {
  id: string;
  title: string;
  description: string;
  target_audience: string;
  questions?: QuestionData[];
}

const CPAQuestionnaireManagement = () => {
  const statusVariants: { [key: string]: "default" | "secondary" | "destructive" } = {
    draft: "default",
    active: "secondary",
    closed: "destructive",
  };
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isInstitutional, setIsInstitutional] = useState(false);
  const [institutionalProfiles, setInstitutionalProfiles] = useState<InstitutionalProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [userTemplates, setUserTemplates] = useState<QuestionnaireTemplate[]>([]);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaveAsTemplateModalOpen, setIsSaveAsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [questionnaireForTemplate, setQuestionnaireForTemplate] = useState<Questionnaire | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<QuestionnaireTemplate | null>(null);
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importedQuestionnaire, setImportedQuestionnaire] = useState<Questionnaire | null>(null);
  const [isPostImportModalOpen, setIsPostImportModalOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [sheetData, setSheetData] = useState<Array<Record<string, unknown>>>([]);


  const form = useForm<QuestionnaireFormValues>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      title: "",
      description: "",
      target_audience: "",
      status: "draft",
      institutional_profile_id: "",
      commission_id: "",
      course_id: undefined,
      templateId: undefined,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = form;

  const selectedInstitutionalProfileId = watch("institutional_profile_id");
  const selectedCourseId = watch("course_id");
  const selectedCommissionId = watch("commission_id");
  const selectedTemplateId = watch("templateId");
  const startDate = watch("start_date");
  const endDate = watch("end_date");

  useEffect(() => {
    const loadInitialData = async () => {
      if (authLoading) {
        return;
      }

      if (!profile) {
        setLoading(false);
        return;
      }

      if (profile.profile_type?.includes("institutional")) {
        setIsInstitutional(true);
        try {


          const { data: instProfilesData, error: instError } = await supabase
            .from("institutional_profiles")
            .select("id, profile_id, institution_name") // Select id, profile_id, and institution_name
            .eq("profile_id", profile.id);

          if (instError) {
            console.error("Supabase error fetching institutional profiles:", instError);
            handleSupabaseError(instError, `Erro Supabase ao carregar perfis institucionais: ${instError.message}`);
            throw instError;
          }



          if (instProfilesData && instProfilesData.length > 0) {
            setInstitutionalProfiles(instProfilesData);
            const initialProfileId = instProfilesData[0].id;
            setValue("institutional_profile_id", initialProfileId);
            await fetchQuestionnaires(initialProfileId);
          } else {
            setInstitutionalProfiles([]);
            setValue("institutional_profile_id", "");
            handleSupabaseError(new Error("Nenhum perfil institucional encontrado para este usuário."));
          }
        } catch (error: Error) {
          console.error("Error fetching institutional profiles:", error.message);
          handleSupabaseError(error, "Erro ao carregar perfis institucionais.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [profile, authLoading, user?.id, setValue]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (selectedInstitutionalProfileId) {
        try {
          const { data, error } = await supabase
            .from("courses")
            .select("id, name")
            .eq("institutional_profile_id", selectedInstitutionalProfileId)
            .order("name", { ascending: true });

          if (error) throw error;
          setCourses(data || []);
        } catch (error: Error) {
          console.error("Error fetching courses:", error.message);
          handleSupabaseError(error, "Erro ao carregar cursos.");
        }
      } else {
        setCourses([]);
      }
    };

    fetchCourses();
  }, [selectedInstitutionalProfileId]);

  const fetchUserTemplates = useCallback(async () => {
    if (selectedInstitutionalProfileId) {
      try {
        const { data, error } = await supabase
          .from("cpa_questionnaire_templates")
          .select("id, title, description, target_audience, questions")
          .eq("institutional_profile_id", selectedInstitutionalProfileId);

        if (error) throw error;
        setUserTemplates(data || []);
      } catch (error: Error) {
        console.error("Error fetching user templates:", error.message);
        handleSupabaseError(error, "Erro ao carregar templates do usuário.");
      }
    } else {
      setUserTemplates([]);
    }
  }, [selectedInstitutionalProfileId]);

  useEffect(() => {
    const fetchCommissions = async () => {
      if (selectedInstitutionalProfileId) {
        try {
          const { data, error } = await supabase
            .from("cpa_commissions")
            .select("*")
            .eq("institutional_profile_id", selectedInstitutionalProfileId);

          if (error) throw error;
          setCommissions(data || []);
        } catch (error: Error) {
          console.error("Error fetching commissions:", error.message);
          handleSupabaseError(error, "Erro ao carregar comissões CPA.");
        }
      } else {
        setCommissions([]);
      }
    };

    fetchCommissions();
    fetchUserTemplates();
  }, [selectedInstitutionalProfileId, fetchUserTemplates]);

  const fetchQuestionnaires = async (instProfileId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cpa_questionnaires")
        .select("*, course:courses(name)")
        .eq("institutional_profile_id", instProfileId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuestionnaires(data || []);
    } catch (error: Error) {
      console.error("Error fetching questionnaires:", error.message);
      handleSupabaseError(error, "Erro ao carregar questionários.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: QuestionnaireFormValues) => {
    setSaving(true);
    try {
      const questionnaireData = {
        institutional_profile_id: data.institutional_profile_id,
        commission_id: data.commission_id,
        course_id: data.course_id,
        title: data.title,
        description: data.description,
        target_audience: data.target_audience,
        start_date: data.start_date ? format(data.start_date, "yyyy-MM-dd") : null,
        end_date: data.end_date ? format(data.end_date, "yyyy-MM-dd") : null,
        status: data.status,
      };



      if (editingQuestionnaire) {
        const { error } = await supabase
          .from("cpa_questionnaires")
          .update(questionnaireData)
          .eq("id", editingQuestionnaire.id);
        if (error) {
          console.error("Supabase update error:", error);
          handleSupabaseError(error);
          throw error;
        }
        toast.success("Questionário atualizado com sucesso!");
      } else {
        const { data: newQuestionnaires, error: insertError } = await supabase
          .from("cpa_questionnaires")
          .insert(questionnaireData)
          .select('id'); // Select the ID of the newly created questionnaire

        if (insertError) {
          console.error("Supabase insert error:", insertError);
          handleSupabaseError(insertError);
          throw insertError;
        }
        toast.success("Questionário criado com sucesso!");

        const newQuestionnaire = newQuestionnaires ? newQuestionnaires[0] : null;

        // If a template was selected, navigate to the builder with the template ID
        setTimeout(() => {
          if (newQuestionnaire && data.templateId && data.templateId !== "none-template") {
            navigate(`/questionnaire/builder/${newQuestionnaire.id}?templateId=${data.templateId}`);
          } else if (newQuestionnaire) {
            navigate(`/questionnaire/builder/${newQuestionnaire.id}`);
          }
        }, 1000); // 1 second delay
      }
      await fetchQuestionnaires(data.institutional_profile_id!); // Re-fetch list
      setIsModalOpen(false);
      reset();
    } catch (error: Error) {
      console.error("Error saving questionnaire:", error.message);
      handleSupabaseError(error, "Erro ao salvar questionário: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestionnaire = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este questionário e todas as suas perguntas e respostas?")) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("cpa_questionnaires")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Questionário excluído com sucesso!");
      await fetchQuestionnaires(selectedInstitutionalProfileId!); // Re-fetch list
    } catch (error: Error) {
      console.error("Error deleting questionnaire:", error.message);
      handleSupabaseError(error, "Erro ao excluir questionário.");
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingQuestionnaire(null);
    reset();
    setIsModalOpen(true);
  };

  const openEditModal = (questionnaire: Questionnaire) => {
    setEditingQuestionnaire(questionnaire);
    reset({
      title: questionnaire.title,
      description: questionnaire.description || "",
      target_audience: questionnaire.target_audience || "",
      start_date: questionnaire.start_date ? new Date(questionnaire.start_date) : undefined,
      end_date: questionnaire.end_date ? new Date(questionnaire.end_date) : undefined,
      status: questionnaire.status,
      institutional_profile_id: questionnaire.institutional_profile_id,
      commission_id: questionnaire.commission_id,
      course_id: questionnaire.course_id || undefined,
      templateId: undefined, // Templates are not part of editing an existing questionnaire
    });
    setIsModalOpen(true);
  };

  const openSaveAsTemplateModal = (questionnaire: Questionnaire) => {
    setQuestionnaireForTemplate(questionnaire);
    setTemplateName(questionnaire.title);
    setIsSaveAsTemplateModalOpen(true);
  };

  const openEditTemplateModal = (template: QuestionnaireTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.title); // Pre-fill with current title
    setIsEditTemplateModalOpen(true);
  };

  const handleSaveAsTemplate = async () => {
    if (!questionnaireForTemplate || !templateName) {
      toast.error("Questionário ou nome do template inválido.");
      return;
    }

    setSaving(true);
    try {
      const { data: questions, error: questionsError } = await supabase
        .from("cpa_questions")
        .select("*")
        .eq("questionnaire_id", questionnaireForTemplate.id);

      if (questionsError) throw questionsError;

      const templateData = {
        user_id: user?.id,
        institutional_profile_id: questionnaireForTemplate.institutional_profile_id,
        title: templateName,
        description: questionnaireForTemplate.description,
        target_audience: questionnaireForTemplate.target_audience,
        questions: questions,
      };

      const { error } = await supabase
        .from("cpa_questionnaire_templates")
        .insert(templateData);

      if (error) throw error;

      toast.success("Template salvo com sucesso!");
      setIsSaveAsTemplateModalOpen(false);
      setTemplateName("");
      setQuestionnaireForTemplate(null);
      fetchUserTemplates(); // Refresh the list of user templates
    } catch (error: Error) {
      console.error("Error saving as template:", error.message);
      handleSupabaseError(error, "Erro ao salvar como template.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !templateName) {
      toast.error("Template ou nome do template inválido.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("cpa_questionnaire_templates")
        .update({ title: templateName }) // Only updating title for now
        .eq("id", editingTemplate.id);

      if (error) throw error;

      toast.success("Template atualizado com sucesso!");
      setIsEditTemplateModalOpen(false);
      setTemplateName("");
      setEditingTemplate(null);
      fetchUserTemplates(); // Refresh the list of user templates
    } catch (error: Error) {
      console.error("Error updating template:", error.message);
      handleSupabaseError(error, "Erro ao atualizar template.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("cpa_questionnaire_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast.success("Template excluído com sucesso!");
      fetchUserTemplates(); // Refresh the list of user templates
    } catch (error: Error) {
      console.error("Error deleting template:", error.message);
      handleSupabaseError(error, "Erro ao excluir template.");
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setValue("templateId", templateId);
    if (templateId && templateId !== "none-template") { // Check for "none-template"
      const template = [...questionnaireTemplates, ...userTemplates].find(t => t.id === templateId);
      if (template) {
        setValue("title", template.title);
        setValue("description", template.description);
        setValue("target_audience", template.target_audience);
        // Do not set dates or status from template, as they are dynamic
      }
    } else {
      // If "Nenhum" (None) or "none-template" is selected, clear the form fields
      setValue("title", "");
      setValue("description", "");
      setValue("target_audience", "");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportXLSX = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    toast.info("Lendo planilha...");

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        setSheetData(json);
        setIsMappingModalOpen(true);
      };
      reader.readAsArrayBuffer(file);
    } catch (error: Error) {
      console.error("Error reading XLSX:", error.message);
      handleSupabaseError(error, "Erro ao ler planilha.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleMappedImport = async (mappedData: Array<Record<string, unknown>>) => {
    setIsMappingModalOpen(false);
    setIsImporting(true);
    toast.info("Importando questionário...");

    try {
      if (!selectedInstitutionalProfileId) {
        toast.error("Selecione uma instituição antes de importar.");
        return;
      }

      const { data: importedData, error } = await supabase.rpc('import_questionnaire_from_xlsx', {
        p_institutional_profile_id: selectedInstitutionalProfileId,
        p_sheet_data: mappedData,
      });

      if (error) throw error;

      setImportedQuestionnaire(importedData);
      setIsPostImportModalOpen(true);
      await fetchQuestionnaires(selectedInstitutionalProfileId);
      toast.success("Questionário importado com sucesso!");
    } catch (error: Error) {
      console.error("Error importing mapped data:", error.message);
      handleSupabaseError(error, "Erro ao importar questionário.");
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isInstitutional) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Você não tem permissão para gerenciar questionários CPA.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Questionários CPA</h2>
        <div className="flex gap-2">
          <Button onClick={handleImportClick} disabled={isImporting}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Importar Questionário
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" /> Criar Novo Questionário
          </Button>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportXLSX}
        className="hidden"
        accept=".xlsx, .xls"
      />

      <div className="space-y-4">
        {questionnaires.length === 0 ? (
          <p className="text-muted-foreground">Nenhum questionário encontrado.</p>
        ) : (
          questionnaires.map((q) => (
            <div key={q.id} className="p-4 border rounded-lg shadow-sm flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{q.title}</h3>
                <p className="text-sm text-muted-foreground">{q.description}</p>
                <p className="text-sm text-muted-foreground">Curso: {q.course?.name || "N/A"}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={statusVariants[q.status] || 'default'}>{q.status}</Badge>
                  <span>|</span>
                  <span>Início: {q.start_date ? format(new Date(q.start_date), "dd/MM/yyyy") : "N/A"}</span>
                  <span>|</span>
                  <span>Fim: {q.end_date ? format(new Date(q.end_date), "dd/MM/yyyy") : "N/A"}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" asChild>
                  <Link to={`/questionnaire/builder/${q.id}`}>
                    <ClipboardList className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="icon" onClick={() => openEditModal(q)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDeleteQuestionnaire(q.id)} disabled={saving}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => openSaveAsTemplateModal(q)} disabled={saving}>
                  <ClipboardPlus className="h-4 w-4" />
                </Button>
                {q.status === 'closed' && (
                  <Button variant="outline" size="icon" asChild>
                    <Link to={`/portal/cpa/results/${q.id}`}>
                      <BarChart3 className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingQuestionnaire ? "Editar Questionário" : "Criar Novo Questionário"}</DialogTitle>
            <DialogDescription>
              {editingQuestionnaire ? "Edite as informações do seu questionário." : "Preencha as informações abaixo para criar um novo questionário."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateId" className="text-right">Usar Template</Label>
              <Select
                value={selectedTemplateId || ""}
                onValueChange={handleTemplateSelect}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecionar um template (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none-template">Nenhum</SelectItem>
                  <div>
                    <SelectSeparator />
                    <p className="py-1.5 pl-8 pr-2 text-sm font-semibold">Modelos Prontos</p>
                    {questionnaireTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </div>
                  {userTemplates.length > 0 && (
                    <div>
                      <SelectSeparator />
                      <p className="py-1.5 pl-8 pr-2 text-sm font-semibold">Meus Templates</p>
                      {userTemplates.map((template) => (
                        <div key={template.id} className="flex items-center justify-between pr-2">
                          <SelectItem value={template.id} className="flex-grow">
                            {template.title}
                          </SelectItem>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditTemplateModal(template); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="institutional_profile_id" className="text-right">Instituição</Label>
              <Select
                value={selectedInstitutionalProfileId || ""}
                onValueChange={(value) => setValue("institutional_profile_id", value)}
                disabled={institutionalProfiles.length === 0} // Disable only if no profiles
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a instituição" />
                </SelectTrigger>
                <SelectContent>
                  {institutionalProfiles.map((ip) => (
                    <SelectItem key={ip.id} value={ip.id}>
                      {ip.institution_name || ip.id} 
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.institutional_profile_id && <p className="col-span-4 text-red-500 text-sm">{errors.institutional_profile_id.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course_id" className="text-right">Curso</Label>
              <Select
                value={selectedCourseId || ""}
                onValueChange={(value) => setValue("course_id", value)}
                disabled={!selectedInstitutionalProfileId || courses.length === 0}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.course_id && <p className="col-span-4 text-red-500 text-sm">{errors.course_id.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="commission_id" className="text-right">Comissão CPA</Label>
              <Select
                value={selectedCommissionId || ""}
                onValueChange={(value) => setValue("commission_id", value)}
                disabled={!selectedInstitutionalProfileId || commissions.length === 0}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a comissão" />
                </SelectTrigger>
                <SelectContent>
                  {commissions.map((commission) => (
                    <SelectItem key={commission.id} value={commission.id}>
                      {`Mandato ${commission.start_date ? format(new Date(commission.start_date), 'yyyy') : ''} - ${commission.end_date ? format(new Date(commission.end_date), 'yyyy') : ''}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.commission_id && <p className="col-span-4 text-red-500 text-sm">{errors.commission_id.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Título</Label>
              <Input id="title" {...register("title")} className="col-span-3" />
              {errors.title && <p className="col-span-4 text-red-500 text-sm">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Descrição</Label>
              <Textarea id="description" {...register("description")} className="col-span-3" />
              {errors.description && <p className="col-span-4 text-red-500 text-sm">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target_audience" className="text-right">Público-Alvo</Label>
              <Input id="target_audience" {...register("target_audience")} className="col-span-3" />
              {errors.target_audience && <p className="col-span-4 text-red-500 text-sm">{errors.target_audience.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal col-span-3",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span className="text-muted-foreground">Selecione a data de início</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => setValue("start_date", date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              {errors.start_date && <p className="col-span-4 text-red-500 text-sm">{errors.start_date.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">Data de Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal col-span-3",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span className="text-muted-foreground">Selecione a data de fim</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => setValue("end_date", date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              {errors.end_date && <p className="col-span-4 text-red-500 text-sm">{errors.end_date.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select value={watch("status")} onValueChange={(value) => setValue("status", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="col-span-4 text-red-500 text-sm">{errors.status.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={saving}>
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                editingQuestionnaire ? "Salvar Alterações" : "Criar Questionário"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSaveAsTemplateModalOpen} onOpenChange={setIsSaveAsTemplateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar como Template</DialogTitle>
            <DialogDescription>
              Digite um nome para o seu novo template.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateName" className="text-right">
                Nome do Template
              </Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveAsTemplateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={saving}>
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                "Salvar Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditTemplateModalOpen} onOpenChange={setIsEditTemplateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>
              Edite o nome do seu template.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTemplateName" className="text-right">
                Nome do Template
              </Label>
              <Input
                id="editTemplateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTemplateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTemplate} disabled={saving}>
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvar Alterações</>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPostImportModalOpen} onOpenChange={setIsPostImportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importação Concluída</DialogTitle>
            <DialogDescription>
              O questionário foi importado com sucesso. O que você gostaria de fazer agora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => navigate(`/questionnaire/builder/${importedQuestionnaire?.id}`)}>
              Editar Formulário
            </Button>
            <Button onClick={() => navigate(`/portal/cpa/results/${importedQuestionnaire?.id}`)}>
              Ir para o Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ColumnMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        onImport={handleMappedImport}
        sheetData={sheetData}
      />
    </div>
  );
};

export default CPAQuestionnaireManagement;

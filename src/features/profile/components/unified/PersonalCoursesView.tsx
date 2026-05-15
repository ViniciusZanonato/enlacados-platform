import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, Trash2, Calendar, ExternalLink } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from 'react';

const PersonalCoursesView = ({ courses, setPersonalCourses, isEditing }) => {
    const [openCertificateDialog, setOpenCertificateDialog] = useState(false);
    const [currentCertificateUrl, setCurrentCertificateUrl] = useState('');

    const handleAdd = () => {
        setPersonalCourses([...courses, { course_name: '', institution: '', completion_date: '', description: '', certificate_url: '' }]);
    };

    const handleRemove = (index) => {
        setPersonalCourses(courses.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        const newCourses = [...courses];
        newCourses[index][field] = value;
        setPersonalCourses(newCourses);
    };

    const handleViewCertificate = (url) => {
        if (!url) return;
        setCurrentCertificateUrl(url);
        setOpenCertificateDialog(true);
    };

    return (
        <Card className="shadow-lg rounded-3xl bg-transparent border-none">
            <CardHeader>
                <CardTitle className="flex items-center text-xl"><BookOpen className="mr-3 h-6 w-6"/> Cursos Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {courses.length > 0 ? (
                    courses.map((course, index) => (
                        <div key={index} className="pl-6 border-l-2 border-primary/20 relative">
                            <div className="absolute -left-[11px] top-1 w-5 h-5 bg-primary rounded-full border-4 border-background"></div>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <Input placeholder="Nome do Curso" value={course.course_name} onChange={(e) => handleChange(index, 'course_name', e.target.value)} />
                                    <Input placeholder="Instituição" value={course.institution} onChange={(e) => handleChange(index, 'institution', e.target.value)} />
                                    <Input type="date" placeholder="Data de Conclusão" value={course.completion_date} onChange={(e) => handleChange(index, 'completion_date', e.target.value)} />
                                    <Input placeholder="URL do Certificado" value={course.certificate_url} onChange={(e) => handleChange(index, 'certificate_url', e.target.value)} />
                                    <Textarea placeholder="Descrição" value={course.description} onChange={(e) => handleChange(index, 'description', e.target.value)} />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon"><Trash2 className="w-4 h-4"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tem certeza que deseja remover este curso? Esta ação não pode ser desfeita.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemove(index)}>Remover</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ) : (
                                <div onClick={() => handleViewCertificate(course.certificate_url)} className={course.certificate_url ? 'cursor-pointer' : ''}>
                                    <h4 className="font-bold text-lg">{course.course_name}</h4>
                                    <p className="font-semibold text-primary">{course.institution}</p>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center"><Calendar className="w-3 h-3 mr-1.5"/>{course.completion_date}</p>
                                    <p className="text-sm mt-3 whitespace-pre-wrap text-muted-foreground">{course.description}</p>
                                    {course.certificate_url && (
                                        <span className="flex items-center text-primary text-sm mt-2 font-semibold">
                                            <ExternalLink className="w-4 h-4 mr-1" /> Ver Certificado
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    !isEditing && <p className="text-sm text-muted-foreground text-center p-4">Nenhum curso pessoal adicionado.</p>
                )}
                {isEditing && <Button onClick={handleAdd} className="w-full"><Plus className="w-4 h-4 mr-2"/>Adicionar Curso</Button>}
            </CardContent>
            <AlertDialog open={openCertificateDialog} onOpenChange={setOpenCertificateDialog}>
                {/* ... AlertDialog content remains the same ... */}
            </AlertDialog>
        </Card>
    );
};

export default PersonalCoursesView;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Plus, Trash2, Calendar } from "lucide-react";

const EducationView = ({ education, setEducation, isEditing }) => {
    const handleAdd = () => {
        setEducation([...education, { institution: '', degree: '', start_date: '', end_date: '', description: '' }]);
    };

    const handleRemove = (index) => {
        setEducation(education.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        const updatedEducation = [...education];
        updatedEducation[index][field] = value;
        setEducation(updatedEducation);
    };

    return (
        <Card className="shadow-lg rounded-3xl bg-transparent border-none">
            <CardHeader>
                <CardTitle className="flex items-center text-xl"><GraduationCap className="mr-3 h-6 w-6"/> Formação Acadêmica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {education.length > 0 ? (
                    education.map((edu, index) => (
                        <div key={index} className="pl-6 border-l-2 border-primary/20 relative">
                             <div className="absolute -left-[11px] top-1 w-5 h-5 bg-primary rounded-full border-4 border-background"></div>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <Input placeholder="Instituição" value={edu.institution} onChange={(e) => handleChange(index, 'institution', e.target.value)} />
                                    <Input placeholder="Curso/Grau" value={edu.degree} onChange={(e) => handleChange(index, 'degree', e.target.value)} />
                                    <div className="flex gap-2">
                                        <Input type="date" placeholder="Data de Início" value={edu.start_date} onChange={(e) => handleChange(index, 'start_date', e.target.value)} />
                                        <Input type="date" placeholder="Data de Fim" value={edu.end_date} onChange={(e) => handleChange(index, 'end_date', e.target.value)} />
                                    </div>
                                    <Textarea placeholder="Descrição" value={edu.description} onChange={(e) => handleChange(index, 'description', e.target.value)} />
                                    <Button variant="destructive" size="icon" onClick={() => handleRemove(index)}><Trash2 className="w-4 h-4"/></Button>
                                </div>
                            ) : (
                                <div>
                                    <h4 className="font-bold text-lg">{edu.degree}</h4>
                                    <p className="font-semibold text-primary">{edu.institution}</p>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center"><Calendar className="w-3 h-3 mr-1.5"/>{edu.start_date} - {edu.end_date || 'Concluído'}</p>
                                    <p className="text-sm mt-3 whitespace-pre-wrap text-muted-foreground">{edu.description}</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    !isEditing && <p className="text-sm text-muted-foreground text-center p-4">Nenhuma formação acadêmica adicionada.</p>
                )}
                {isEditing && <Button onClick={handleAdd} className="w-full"><Plus className="w-4 h-4 mr-2"/>Adicionar Formação</Button>}
            </CardContent>
        </Card>
    );
};

export default EducationView;

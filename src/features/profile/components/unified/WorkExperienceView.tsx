import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Plus, Trash2, Calendar } from "lucide-react";

const WorkExperienceView = ({ workExperience, setWorkExperience, isEditing }) => {
    const handleAdd = () => {
        setWorkExperience([...workExperience, { company: '', role: '', start_date: '', end_date: '', description: '' }]);
    };

    const handleRemove = (index) => {
        setWorkExperience(workExperience.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        const updatedExperience = [...workExperience];
        updatedExperience[index][field] = value;
        setWorkExperience(updatedExperience);
    };

    return (
        <Card className="shadow-lg rounded-3xl bg-transparent border-none">
            <CardHeader>
                <CardTitle className="flex items-center text-xl"><Briefcase className="mr-3 h-6 w-6"/> Experiência Profissional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {workExperience.length > 0 ? (
                    workExperience.map((exp, index) => (
                        <div key={index} className="pl-6 border-l-2 border-primary/20 relative">
                             <div className="absolute -left-[11px] top-1 w-5 h-5 bg-primary rounded-full border-4 border-background"></div>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <Input placeholder="Empresa" value={exp.company} onChange={(e) => handleChange(index, 'company', e.target.value)} />
                                    <Input placeholder="Cargo" value={exp.role} onChange={(e) => handleChange(index, 'role', e.target.value)} />
                                    <div className="flex gap-2">
                                        <Input type="date" placeholder="Data de Início" value={exp.start_date} onChange={(e) => handleChange(index, 'start_date', e.target.value)} />
                                        <Input type="date" placeholder="Data de Fim" value={exp.end_date} onChange={(e) => handleChange(index, 'end_date', e.target.value)} />
                                    </div>
                                    <Textarea placeholder="Descrição" value={exp.description} onChange={(e) => handleChange(index, 'description', e.target.value)} />
                                    <Button variant="destructive" size="icon" onClick={() => handleRemove(index)}><Trash2 className="w-4 h-4"/></Button>
                                </div>
                            ) : (
                                <div>
                                    <h4 className="font-bold text-lg">{exp.role}</h4>
                                    <p className="font-semibold text-primary">{exp.company}</p>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center"><Calendar className="w-3 h-3 mr-1.5"/>{exp.start_date} - {exp.end_date || 'Presente'}</p>
                                    <p className="text-sm mt-3 whitespace-pre-wrap text-muted-foreground">{exp.description}</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    !isEditing && <p className="text-sm text-muted-foreground text-center p-4">Nenhuma experiência profissional adicionada.</p>
                )}
                {isEditing && <Button onClick={handleAdd} className="w-full"><Plus className="w-4 h-4 mr-2"/>Adicionar Experiência</Button>}
            </CardContent>
        </Card>
    );
};

export default WorkExperienceView;

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COURSE_CATEGORIES } from "@/features/profile/constants";


// Reusable component for editable institutional courses
const InstitutionalCoursesView = ({ courses, setCourses, isEditing }) => {
    const handleAdd = () => {
        setCourses([...courses, { name: '', category: '', landing_page_url: '', description: '' }]);
    };

    const handleRemove = (index) => {
        setCourses(courses.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        const newCourses = [...courses];
        newCourses[index][field] = value;
        setCourses(newCourses);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Cursos Oferecidos</h3>
                {isEditing && <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-2" /> Adicionar Curso</Button>}
            </div>
            <div className="space-y-4">
                {courses.map((course, index) => (
                    <Card key={index}>
                        <CardContent className="p-4">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <Input placeholder="Nome do Curso" value={course.name} onChange={(e) => handleChange(index, 'name', e.target.value)} />
                                    <Select value={course.category} onValueChange={(value) => handleChange(index, 'category', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a Categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COURSE_CATEGORIES.map((category) => (
                                                <SelectItem key={category} value={category}>{category}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input placeholder="URL da Landing Page" value={course.landing_page_url} onChange={(e) => handleChange(index, 'landing_page_url', e.target.value)} />
                                    <Textarea placeholder="Descrição" value={course.description} onChange={(e) => handleChange(index, 'description', e.target.value)} />
                                    <Button variant="destructive" size="sm" onClick={() => handleRemove(index)}>Remover</Button>
                                </div>
                            ) : (
                                <div>
                                    <h4 className="font-semibold">{course.name}</h4>
                                    <p className="text-sm text-muted-foreground">{course.category}</p>
                                    {course.landing_page_url && (
                                        <Button asChild variant="link" className="p-0 h-auto mt-2">
                                            <a href={course.landing_page_url} target="_blank" rel="noopener noreferrer">Saber mais</a>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default InstitutionalCoursesView;

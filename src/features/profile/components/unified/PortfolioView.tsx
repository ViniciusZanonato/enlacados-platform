import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link, Plus, Trash2 } from "lucide-react";

const PortfolioView = ({ portfolio, setPortfolio, isEditing }) => {
    const safePortfolio = portfolio || [];

    const handleAdd = () => {
        setPortfolio([...safePortfolio, { title: '', url: '', description: '' }]);
    };

    const handleRemove = (index) => {
        setPortfolio(safePortfolio.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        const updatedPortfolio = [...safePortfolio];
        updatedPortfolio[index][field] = value;
        setPortfolio(updatedPortfolio);
    };

    return (
        <Card className="bg-background/20">
            <CardHeader>
                <CardTitle className="text-lg">Portfólio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isEditing && <Button onClick={handleAdd} size="sm" className="mb-4"><Plus className="w-4 h-4 mr-2"/>Adicionar Item</Button>}
                {safePortfolio.length > 0 ? (
                    safePortfolio.map((item, index) => (
                        <Card key={index} className="bg-background/50 p-4">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <Input placeholder="Título do Projeto" value={item.title} onChange={(e) => handleChange(index, 'title', e.target.value)} />
                                    <Input placeholder="URL do Projeto" value={item.url} onChange={(e) => handleChange(index, 'url', e.target.value)} />
                                    <Textarea placeholder="Descrição" value={item.description} onChange={(e) => handleChange(index, 'description', e.target.value)} />
                                    <Button variant="destructive" size="icon" onClick={() => handleRemove(index)}><Trash2 className="w-4 h-4"/></Button>
                                </div>
                            ) : (
                                <div>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">{item.title}</a>
                                    <p className="text-sm mt-2 whitespace-pre-wrap text-muted-foreground">{item.description}</p>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center mt-2">
                                        <Link className="w-3 h-3 mr-1"/> Ver projeto
                                    </a>
                                </div>
                            )}
                        </Card>
                    ))
                ) : (
                    !isEditing && <p className="text-sm text-muted-foreground text-center p-4">Nenhum item no portfólio. Clique em 'Editar' para adicionar seus projetos.</p>
                )}
            </CardContent>
        </Card>
    );
};

export default PortfolioView;

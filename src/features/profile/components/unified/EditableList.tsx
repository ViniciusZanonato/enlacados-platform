import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface EditableListProps {
    title: string;
    items: string[];
    setItems: (items: string[]) => void;
    isEditing: boolean;
}

const EditableList = ({ title, items, setItems, isEditing }: EditableListProps) => {
    const [newItem, setNewItem] = useState("");
    const safeItems = items || []; // Ensure items is always an array

    const handleAdd = () => {
        if (newItem.trim()) {
            setItems([...safeItems, newItem.trim()]);
            setNewItem("");
        }
    };

    const handleRemove = (index: number) => {
        setItems(safeItems.filter((_, i) => i !== index));
    };

    return (
        <Card className="bg-background/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {isEditing && (
                    <div className="flex gap-2 mb-4">
                        <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={`Adicionar ${title.toLowerCase().slice(0, -1)}`} />
                        <Button onClick={handleAdd} size="icon"><Plus className="w-4 h-4" /></Button>
                    </div>
                )}
                <div className="flex flex-wrap gap-2">
                    {safeItems.length > 0 ? (
                        safeItems.map((item, index) => (
                            <Badge key={index} variant={isEditing ? "default" : "secondary"} className="py-1 px-3 text-sm">
                                {item}
                                {isEditing && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <X className="w-3 h-3 ml-2 cursor-pointer" />
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tem certeza que deseja remover este item? Esta ação não pode ser desfeita.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemove(index)}>Remover</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </Badge>
                        ))
                    ) : (
                        !isEditing && (
                            <p className="text-sm text-muted-foreground p-4 text-center w-full">Nenhum item adicionado. Clique em 'Editar' para adicionar suas {title.toLowerCase()}.</p>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default EditableList;

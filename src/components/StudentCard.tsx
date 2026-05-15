import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const StudentCard = ({ student, onClick, onRemove }) => {
  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <Card
      className="hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer"
      onClick={() => onClick(student)}
    >
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={student.avatar_url} />
            <AvatarFallback>{student.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground truncate">{student.full_name}</p>
              {student.status === 'pending' && <Badge variant="outline" className="shrink-0">PENDENTE</Badge>}
            </div>
            <p className="text-sm text-muted-foreground truncate">{student.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRemove} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default StudentCard;

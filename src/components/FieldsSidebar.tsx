import { useDraggable } from '@dnd-kit/core';
import { fillableFields, constructionFields } from '@/data/formFields';

// New component for a single draggable item
const DraggableSidebarItem = ({ field, onAddField }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `sidebar-handle-${field.type}`, // The ID needs to be unique
    data: { type: field.type, fromSidebar: true },
  });
  const Icon = field.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onAddField(field.type)}
      className="flex items-center rounded-lg border p-2 cursor-grab hover:bg-muted transition-colors"
    >
      <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{field.label}</span>
    </div>
  );
};


interface FieldsSidebarProps {
  onAddField: (type: string) => void;
}

const FieldsSidebar = ({ onAddField }: FieldsSidebarProps) => {
  return (
    <div className="w-64 p-4 border-r bg-card space-y-6 h-screen overflow-y-auto">
      <div>
        <h3 className="text-lg font-semibold mb-2">Campos Preenchíveis</h3>
        <div className="space-y-2">
          {fillableFields.map((field) => (
            <DraggableSidebarItem key={field.type} field={field} onAddField={onAddField} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Construção de Formulário</h3>
        <div className="space-y-2">
          {constructionFields.map((field) => (
            <DraggableSidebarItem key={field.type} field={field} onAddField={onAddField} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FieldsSidebar;

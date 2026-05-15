import {
  Type,
  Baseline,
  Hash,
  Calendar,
  Mail,
  Phone,
  CircleDot,
  CheckSquare,
  ChevronDownSquare,
  FileUp,
  Minus,
  FileImage,
  BookCopy,
  Star,
  SlidersHorizontal
} from 'lucide-react';

export const fillableFields = [
  { type: 'text', label: 'Texto Curto', icon: Type },
  { type: 'textarea', label: 'Texto Longo', icon: Baseline },
  { type: 'number', label: 'Número', icon: Hash },
  { type: 'date', label: 'Data', icon: Calendar },
  { type: 'email', label: 'E-mail', icon: Mail },
  { type: 'tel', label: 'Telefone', icon: Phone },
  { type: 'radio', label: 'Seleção Única', icon: CircleDot },
  { type: 'checkbox', label: 'Seleção Múltipla', icon: CheckSquare },
  { type: 'select', label: 'Lista Suspensa', icon: ChevronDownSquare },
  { type: 'likert', label: 'Escala Likert', icon: Star },
  { type: 'rating', label: 'Avaliação por Estrelas', icon: Star },
  { type: 'slider', label: 'Slider Numérico', icon: SlidersHorizontal },
  { type: 'file', label: 'Upload de Arquivo', icon: FileUp },
];

export const constructionFields = [
    { type: 'separator', label: 'Divisor de Categorias', icon: Minus },
    { type: 'page_break', label: 'Múltiplas Páginas', icon: BookCopy },
    { type: 'header_image', label: 'Banner/Logo', icon: FileImage },
];

export const allFields = [...fillableFields, ...constructionFields];

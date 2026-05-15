export interface ChartConfig {
  id: string;
  title: string;
  type: string;
  dimension: string;
  dimensionY?: string | null;
  question_type?: string;
  columns?: string[];
  metric?: string;
  palette: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Template {
  id: string;
  name: string;
  charts: ChartConfig[];
}

export interface Answer {
  question: string;
  answer: string;
}

export interface LatestResponse {
  id: string;
  submitted_at: string;
  answers: Answer[];
}

export interface Question {
  id: string;
  question_text: string;
  question_type: string;
}

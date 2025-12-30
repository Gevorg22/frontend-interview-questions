export interface Topic {
  title: string;
  intro: string;
  questions: string[];
  totalQuestions: number;
}

export interface CategoryData {
  [category: string]: Topic[];
}

export interface QuestionProgress {
  [questionId: string]: boolean;
}

export interface ProgressData {
  questions: QuestionProgress;
}

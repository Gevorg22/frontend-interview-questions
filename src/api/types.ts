export interface QuestionReview {
  lastMarked: number;
  interval: number;
  repetitions: number;
}

export interface QuestionsData {
  id: string;
  userId: string;
  progress: Record<string, boolean>;
  spacedRepetition: Record<string, QuestionReview>;
  updatedAt: string;
}

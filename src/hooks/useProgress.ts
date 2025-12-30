import { useState, useEffect } from 'react';
import type { QuestionProgress } from '../types';

const STORAGE_KEY = 'frontend-questions-progress';

export const useProgress = () => {
  const [progress, setProgress] = useState<QuestionProgress>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.questions || {};
      } catch {
        return {};
      }
    } else {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ questions: progress }));
  }, [progress]);

  const toggleQuestion = (questionId: string) => {
    setProgress((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const isCompleted = (questionId: string): boolean => {
    return progress[questionId] || false;
  };

  const getStats = (totalQuestions: number, categoryQuestions: string[]): { completed: number; remaining: number; percentage: number } => {
    const completed = categoryQuestions.filter((qId) => progress[qId]).length;
    const remaining = totalQuestions - completed;
    const percentage = totalQuestions > 0 ? Math.round((completed / totalQuestions) * 100) : 0;
    
    return { completed, remaining, percentage };
  };

  return {
    progress,
    toggleQuestion,
    isCompleted,
    getStats,
  };
};

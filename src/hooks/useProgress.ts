import { useState, useEffect } from 'react';
import type { QuestionProgress } from '../types';
import { mockApi } from '../api/mockApi';

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

  // Загрузить прогресс с mockapi при монтировании
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = await mockApi.fetchData();
        if (data.progress && Object.keys(data.progress).length > 0) {
          setProgress(data.progress);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ questions: data.progress }));
        }
      } catch (error) {
        console.error('Failed to load progress from mockapi:', error);
      }
    };

    loadProgress();
  }, []);

  // Синхронизировать прогресс с mockapi и localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ questions: progress }));
      
      // Асинхронно отправляем на mockapi
      mockApi.updateData({ progress }).catch(error => {
        console.error('Failed to sync progress to mockapi:', error);
      });
    }, 1000); // Ждём 1 секунду перед синхронизацией (debounce)

    return () => clearTimeout(timer);
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

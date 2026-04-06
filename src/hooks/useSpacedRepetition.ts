import { useState, useEffect } from 'react';

interface QuestionReview {
  lastMarked: number;
  interval: number;
  repetitions: number;
}

const STORAGE_KEY = 'frontend-questions-spaced-repetition';
const INTERVALS = [1, 2, 4, 7, 14, 21, 30];

export const useSpacedRepetition = () => {
  const [reviewData, setReviewData] = useState<Record<string, QuestionReview>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviewData));
  }, [reviewData]);

  const recordLearned = (questionId: string) => {
    setReviewData((prev) => {
      const current = prev[questionId];
      const nextRepetition = current ? current.repetitions + 1 : 1;
      const nextInterval = INTERVALS[Math.min(nextRepetition - 1, INTERVALS.length - 1)];

      return {
        ...prev,
        [questionId]: {
          lastMarked: Date.now(),
          interval: nextInterval,
          repetitions: nextRepetition,
        },
      };
    });
  };

  const shouldBeUnlearned = (questionId: string): boolean => {
    const review = reviewData[questionId];
    if (!review) return false;

    const daysSinceMarked = (Date.now() - review.lastMarked) / (1000 * 60 * 60 * 24);
    return daysSinceMarked >= review.interval;
  };

  const getReviewInfo = (questionId: string) => {
    const review = reviewData[questionId];
    if (!review) {
      return {
        daysUntilReview: 0,
        isDue: false,
        repetitions: 0,
      };
    }

    const daysSinceMarked = (Date.now() - review.lastMarked) / (1000 * 60 * 60 * 24);
    const daysUntilReview = Math.max(0, Math.ceil(review.interval - daysSinceMarked));

    return {
      daysUntilReview,
      isDue: daysSinceMarked >= review.interval,
      repetitions: review.repetitions,
    };
  };

  return {
    recordLearned,
    shouldBeUnlearned,
    getReviewInfo,
  };
};

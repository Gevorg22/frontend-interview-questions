import { useState, useEffect } from 'react';
import { mockApi } from '../api/mockApi';
import type { QuestionReview } from '../api/types';

const STORAGE_KEY = 'frontend-questions-spaced-repetition';
const INTERVALS = [1, 2, 3, 7, 14, 30, 60, 90, 120];

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
    const loadReviewData = async () => {
      try {
        const data = await mockApi.fetchData();
        if (data.spacedRepetition && Object.keys(data.spacedRepetition).length > 0) {
          const normalizedData: Record<string, QuestionReview> = {};
          
          Object.entries(data.spacedRepetition).forEach(([key, value]) => {
            normalizedData[key] = {
              lastMarked: value.lastMarked,
              interval: value.interval,
              repetitions: value.repetitions,
            };
          });
          
          setReviewData(normalizedData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedData));
        }
      } catch (error) {
        console.error('Failed to load spaced repetition from mockapi:', error);
      }
    };

    loadReviewData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviewData));
      mockApi.updateData({ spacedRepetition: reviewData }).catch(error => {
        console.error('Failed to sync spaced repetition to mockapi:', error);
      });
    }, 1000);

    return () => clearTimeout(timer);
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


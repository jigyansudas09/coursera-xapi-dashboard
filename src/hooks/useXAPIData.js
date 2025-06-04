import { useState, useEffect, useCallback } from 'react';
import CourseraXAPIService from '../services/courseraXAPI';
import xapiConfig from '../services/xapiConfig';

/**
 * Custom React hook for managing xAPI data
 * @param {string} userEmail - User's email address
 * @param {string} courseId - Course ID to fetch data for
 * @returns {Object} - Hook state and methods
 */
export const useXAPIData = (userEmail, courseId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Initialize xAPI service
  const [xapiService, setXapiService] = useState(null);

  useEffect(() => {
    if (xapiConfig.isConfigured()) {
      const config = xapiConfig.getConfig();
      const service = new CourseraXAPIService(
        config.endpoint,
        config.username,
        config.password
      );
      setXapiService(service);
    } else {
      setError('xAPI configuration is incomplete. Please check your environment variables.');
    }
  }, []);

  /**
   * Fetch all dashboard data
   */
  const fetchData = useCallback(async () => {
    if (!xapiService || !userEmail || !courseId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dashboardData = await xapiService.getDashboardData(userEmail, courseId);
      setData(dashboardData);
      setLastFetch(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch xAPI data:', err);
    } finally {
      setLoading(false);
    }
  }, [xapiService, userEmail, courseId]);

  /**
   * Test xAPI connection
   */
  const testConnection = useCallback(async () => {
    if (!xapiService) return false;

    try {
      return await xapiService.testConnection();
    } catch (err) {
      console.error('Connection test failed:', err);
      return false;
    }
  }, [xapiService]);

  /**
   * Refresh data
   */
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Auto-fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastFetch,
    refresh,
    testConnection,
    isConfigured: xapiConfig.isConfigured()
  };
};

/**
 * Hook for fetching specific xAPI data types
 */
export const useXAPIQuery = (userEmail, courseId, queryType) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSpecificData = useCallback(async () => {
    if (!xapiConfig.isConfigured() || !userEmail || !courseId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const config = xapiConfig.getConfig();
      const service = new CourseraXAPIService(
        config.endpoint,
        config.username,
        config.password
      );

      let result;
      switch (queryType) {
        case 'modules':
          result = await service.getModuleCompletions(userEmail, courseId);
          break;
        case 'quizzes':
          result = await service.getQuizScores(userEmail, courseId);
          break;
        case 'videos':
          result = await service.getVideoInteractions(userEmail, courseId);
          break;
        case 'assignments':
          result = await service.getAssignmentData(userEmail, courseId);
          break;
        case 'timeline':
          result = await service.getLearningTimeline(userEmail, courseId);
          break;
        default:
          throw new Error(Unknown query type: );
      }

      setData(result);
    } catch (err) {
      setError(err.message);
      console.error(Failed to fetch  data:, err);
    } finally {
      setLoading(false);
    }
  }, [userEmail, courseId, queryType]);

  useEffect(() => {
    fetchSpecificData();
  }, [fetchSpecificData]);

  return { data, loading, error, refetch: fetchSpecificData };
};
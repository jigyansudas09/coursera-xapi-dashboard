import { useState, useEffect, useMemo } from 'react';
import { useXAPIData } from './useXAPIData';
import { DataAggregator } from '../utils/dataAggregator';
import { DataValidator } from '../utils/dataValidator';

/**
 * Hook for processed and validated dashboard data
 * @param {string} userEmail - User's email
 * @param {string} courseId - Course ID
 * @returns {Object} - Processed data and utilities
 */
export const useProcessedData = (userEmail, courseId) => {
  const { data: rawData, loading, error, refresh, testConnection } = useXAPIData(userEmail, courseId);
  const [processedData, setProcessedData] = useState(null);
  const [processingError, setProcessingError] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);

  // Process raw data when it changes
  useEffect(() => {
    if (!rawData) {
      setProcessedData(null);
      return;
    }

    try {
      setProcessingError(null);

      // Validate raw data
      const validation = DataValidator.validateDashboardData(rawData);
      if (!validation.isValid) {
        throw new Error(Data validation failed: );
      }

      // Process and aggregate data
      const processed = DataAggregator.createDashboardSummary(rawData);
      
      // Detect anomalies
      const anomalies = DataValidator.detectAnomalies(processed);
      
      setProcessedData({
        ...processed,
        anomalies,
        validation
      });

      setDataQuality(processed.overview.dataQuality);

    } catch (err) {
      console.error('Data processing error:', err);
      setProcessingError(err.message);
    }
  }, [rawData]);

  // Memoized derived data
  const insights = useMemo(() => {
    return processedData?.insights || [];
  }, [processedData]);

  const chartData = useMemo(() => {
    return processedData?.charts || {};
  }, [processedData]);

  const metrics = useMemo(() => {
    if (!processedData) return null;

    return {
      progress: processedData.progress,
      scores: processedData.scores,
      engagement: processedData.engagement,
      timeline: processedData.timeline
    };
  }, [processedData]);

  // Utility functions
  const getInsightsByCategory = (category) => {
    return insights.filter(insight => insight.category === category);
  };

  const getMetricTrend = (metric) => {
    if (!processedData) return 'stable';
    
    switch (metric) {
      case 'scores':
        return processedData.scores.trend;
      case 'engagement':
        return processedData.engagement.currentStreak > processedData.engagement.longestStreak / 2 
          ? 'improving' : 'stable';
      default:
        return 'stable';
    }
  };

  const exportData = (format = 'json') => {
    if (!processedData) return null;

    switch (format) {
      case 'json':
        return JSON.stringify(processedData, null, 2);
      case 'csv':
        return convertToCSV(processedData);
      default:
        return processedData;
    }
  };

  const convertToCSV = (data) => {
    // Convert timeline data to CSV format
    const timeline = data.timeline || [];
    const headers = ['Date', 'Total Activities', 'Completions', 'Average Score', 'Video Time'];
    const rows = timeline.map(day => [
      day.date,
      day.totalActivities,
      day.completions,
      day.averageScore || '',
      day.videoTimeFormatted || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  return {
    // Data
    data: processedData,
    rawData,
    metrics,
    insights,
    chartData,
    dataQuality,

    // Status
    loading,
    error: error || processingError,
    
    // Utilities
    refresh,
    testConnection,
    getInsightsByCategory,
    getMetricTrend,
    exportData,

    // Flags
    hasData: !!processedData,
    hasAnomalies: processedData?.anomalies?.hasAnomalies || false,
    isStale: dataQuality?.freshness < 80
  };
};

/**
 * Hook for specific metric data with processing
 * @param {string} userEmail - User's email
 * @param {string} courseId - Course ID
 * @param {string} metric - Specific metric to focus on
 * @returns {Object} - Processed metric data
 */
export const useMetricData = (userEmail, courseId, metric) => {
  const { data, loading, error } = useProcessedData(userEmail, courseId);
  
  const metricData = useMemo(() => {
    if (!data) return null;

    switch (metric) {
      case 'progress':
        return {
          data: data.progress,
          chart: data.charts.progress,
          insights: data.insights.filter(i => i.category === 'progress')
        };
      case 'scores':
        return {
          data: data.scores,
          chart: data.charts.scores,
          distribution: data.charts.distribution,
          insights: data.insights.filter(i => i.category === 'performance')
        };
      case 'engagement':
        return {
          data: data.engagement,
          chart: data.charts.engagement,
          insights: data.insights.filter(i => i.category === 'engagement')
        };
      case 'timeline':
        return {
          data: data.timeline,
          chart: data.charts.timeline,
          insights: data.insights.filter(i => i.category === 'habits')
        };
      default:
        return null;
    }
  }, [data, metric]);

  return {
    data: metricData,
    loading,
    error,
    hasData: !!metricData
  };
};
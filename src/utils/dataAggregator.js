/**
 * Data Aggregation Utilities
 * Advanced aggregation and statistical analysis
 */
export class DataAggregator {

  /**
   * Create comprehensive dashboard summary
   * @param {Object} rawData - Raw xAPI dashboard data
   * @returns {Object} - Processed dashboard summary
   */
  static createDashboardSummary(rawData) {
    const { overview, modules, assessments, engagement, timeline } = rawData;
    
    // Process all statement types
    const allStatements = [
      ...modules.completed,
      ...assessments.quizzes,
      ...assessments.assignments,
      ...engagement.videoInteractions
    ];

    // Calculate comprehensive metrics
    const progressData = CourseDataProcessor.calculateProgress(allStatements);
    const scoreData = CourseDataProcessor.aggregateScores([
      ...assessments.quizzes,
      ...assessments.assignments
    ]);
    const timelineData = CourseDataProcessor.generateTimelineData(allStatements);
    const engagementMetrics = CourseDataProcessor.calculateEngagementMetrics(allStatements);

    // Generate insights
    const insights = this.generateInsights({
      progress: progressData,
      scores: scoreData,
      engagement: engagementMetrics,
      timeline: timelineData
    });

    return {
      overview: {
        ...overview,
        lastUpdated: new Date(),
        dataQuality: this.assessDataQuality(allStatements)
      },
      progress: progressData,
      scores: scoreData,
      timeline: timelineData,
      engagement: engagementMetrics,
      insights,
      charts: {
        progress: ChartDataTransformer.transformProgressChart(progressData),
        scores: ChartDataTransformer.transformScoreChart(scoreData),
        timeline: ChartDataTransformer.transformTimelineChart(timelineData),
        distribution: ChartDataTransformer.transformDistributionChart(scoreData.distribution),
        engagement: ChartDataTransformer.transformEngagementRadar(engagementMetrics)
      }
    };
  }

  /**
   * Generate actionable insights from data
   * @param {Object} data - Processed data object
   * @returns {Array} - Array of insight objects
   */
  static generateInsights(data) {
    const insights = [];

    // Progress insights
    if (data.progress.percentage >= 80) {
      insights.push({
        type: 'success',
        category: 'progress',
        title: 'Excellent Progress!',
        message: You've completed % of the course. Keep up the great work!,
        priority: 'high'
      });
    } else if (data.progress.percentage < 30) {
      insights.push({
        type: 'warning',
        category: 'progress',
        title: 'Let\'s Get Moving',
        message: 'Consider setting aside more time for learning to maintain steady progress.',
        priority: 'medium'
      });
    }

    // Score insights
    if (data.scores.trend === 'improving') {
      insights.push({
        type: 'success',
        category: 'performance',
        title: 'Improving Performance',
        message: Your scores are trending upward! Average: %,
        priority: 'high'
      });
    } else if (data.scores.trend === 'declining') {
      insights.push({
        type: 'warning',
        category: 'performance',
        title: 'Performance Dip',
        message: 'Your recent scores are lower than before. Consider reviewing previous materials.',
        priority: 'high'
      });
    }

    // Engagement insights
    if (data.engagement.currentStreak >= 7) {
      insights.push({
        type: 'success',
        category: 'engagement',
        title: 'Amazing Streak!',
        message: ${data.engagement.currentStreak} days of consistent learning. You're on fire!,
        priority: 'high'
      });
    } else if (data.engagement.currentStreak === 0) {
      insights.push({
        type: 'info',
        category: 'engagement',
        title: 'Time to Resume',
        message: 'Start a new learning streak today! Consistency is key to success.',
        priority: 'medium'
      });
    }

    // Study pattern insights
    const recentActivity = data.timeline.slice(-7);
    const avgDailyActivities = recentActivity.reduce((sum, day) => sum + day.totalActivities, 0) / recentActivity.length;
    
    if (avgDailyActivities >= 5) {
      insights.push({
        type: 'success',
        category: 'habits',
        title: 'Great Study Habits',
        message: You're averaging  activities per day this week.,
        priority: 'medium'
      });
    }

    // Video engagement insights
    if (data.engagement.totalVideoTime > 3600) { // More than 1 hour
      insights.push({
        type: 'info',
        category: 'engagement',
        title: 'Video Learner',
        message: You've watched  of video content. Great visual learning!,
        priority: 'low'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Assess data quality and completeness
   * @param {Array} statements - All xAPI statements
   * @returns {Object} - Data quality assessment
   */
  static assessDataQuality(statements) {
    const quality = {
      score: 100,
      issues: [],
      completeness: 100,
      freshness: 100
    };

    // Check data freshness
    if (statements.length > 0) {
      const latestActivity = new Date(Math.max(...statements.map(s => new Date(s.timestamp))));
      const daysSinceLatest = (new Date() - latestActivity) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLatest > 7) {
        quality.freshness = Math.max(0, 100 - (daysSinceLatest - 7) * 10);
        quality.issues.push('Data is more than a week old');
      }
    } else {
      quality.freshness = 0;
      quality.issues.push('No activity data available');
    }

    // Check for missing result data
    const statementsWithResults = statements.filter(s => s.result);
    const resultCompleteness = statements.length > 0 ? (statementsWithResults.length / statements.length) * 100 : 0;
    
    if (resultCompleteness < 80) {
      quality.completeness = resultCompleteness;
      quality.issues.push('Some activities missing result data');
    }

    // Calculate overall score
    quality.score = Math.round((quality.completeness + quality.freshness) / 2);

    return quality;
  }

  /**
   * Create comparison data for multiple time periods
   * @param {Array} statements - All statements
   * @param {string} period - 'week', 'month', 'quarter'
   * @returns {Object} - Comparison data
   */
  static createPeriodComparison(statements, period = 'week') {
    const now = new Date();
    let periodMs;
    
    switch (period) {
      case 'week':
        periodMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        periodMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case 'quarter':
        periodMs = 90 * 24 * 60 * 60 * 1000;
        break;
      default:
        periodMs = 7 * 24 * 60 * 60 * 1000;
    }

    const currentPeriodStart = new Date(now - periodMs);
    const previousPeriodStart = new Date(now - (2 * periodMs));

    const currentPeriodStatements = statements.filter(s => 
      new Date(s.timestamp) >= currentPeriodStart
    );
    const previousPeriodStatements = statements.filter(s => 
      new Date(s.timestamp) >= previousPeriodStart && new Date(s.timestamp) < currentPeriodStart
    );

    const currentMetrics = this.calculatePeriodMetrics(currentPeriodStatements);
    const previousMetrics = this.calculatePeriodMetrics(previousPeriodStatements);

    return {
      current: currentMetrics,
      previous: previousMetrics,
      changes: this.calculateChanges(currentMetrics, previousMetrics),
      period
    };
  }

  /**
   * Calculate metrics for a specific period
   * @param {Array} statements - Statements for the period
   * @returns {Object} - Period metrics
   */
  static calculatePeriodMetrics(statements) {
    const completions = statements.filter(s => 
      s.verb.id === 'http://adlnet.gov/expapi/verbs/completed'
    ).length;

    const scores = statements
      .filter(s => s.result?.score)
      .map(s => Math.round(s.result.score.scaled * 100));

    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;

    return {
      totalActivities: statements.length,
      completions,
      averageScore: Math.round(averageScore),
      uniqueDays: new Set(statements.map(s => 
        new Date(s.timestamp).toISOString().split('T')[0]
      )).size
    };
  }

  /**
   * Calculate percentage changes between periods
   * @param {Object} current - Current period metrics
   * @param {Object} previous - Previous period metrics
   * @returns {Object} - Change percentages
   */
  static calculateChanges(current, previous) {
    const calculateChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      totalActivities: calculateChange(current.totalActivities, previous.totalActivities),
      completions: calculateChange(current.completions, previous.completions),
      averageScore: calculateChange(current.averageScore, previous.averageScore),
      uniqueDays: calculateChange(current.uniqueDays, previous.uniqueDays)
    };
  }
}

// Import the CourseDataProcessor and ChartDataTransformer
import { CourseDataProcessor } from './dataProcessor.js';
import { ChartDataTransformer } from './chartDataTransformer.js';
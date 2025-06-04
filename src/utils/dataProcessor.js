/**
 * Core Data Processor for xAPI Statements
 * Transforms raw xAPI data into dashboard-ready formats
 */
export class CourseDataProcessor {
  
  /**
   * Calculate overall course progress from statements
   * @param {Array} statements - Array of xAPI statements
   * @returns {Object} - Progress statistics
   */
  static calculateProgress(statements) {
    const completedActivities = new Set();
    const totalActivities = new Set();
    const moduleCompletions = [];
    
    statements.forEach(stmt => {
      const activityId = stmt.object.id;
      const activityType = stmt.object.definition?.type;
      
      // Track all unique activities
      totalActivities.add(activityId);
      
      // Track completed activities
      if (stmt.verb.id === 'http://adlnet.gov/expapi/verbs/completed') {
        completedActivities.add(activityId);
        
        // Track module completions specifically
        if (activityType === 'http://coursera.org/xapi/activity-types/module') {
          moduleCompletions.push({
            id: activityId,
            name: stmt.object.definition.name['en-US'] || 'Unknown Module',
            completedAt: new Date(stmt.timestamp),
            actor: stmt.actor.name
          });
        }
      }
    });
    
    const completed = completedActivities.size;
    const total = totalActivities.size;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      completed,
      total,
      percentage,
      remaining: total - completed,
      moduleCompletions: moduleCompletions.sort((a, b) => b.completedAt - a.completedAt),
      lastActivity: statements.length > 0 ? new Date(statements[0].timestamp) : null
    };
  }

  /**
   * Aggregate and analyze quiz/assessment scores
   * @param {Array} scoreStatements - Array of score-related statements
   * @returns {Object} - Score analytics
   */
  static aggregateScores(scoreStatements) {
    if (!scoreStatements || scoreStatements.length === 0) {
      return {
        scores: [],
        average: 0,
        highest: 0,
        lowest: 0,
        totalAttempts: 0,
        passRate: 0,
        trend: 'stable'
      };
    }

    const scores = scoreStatements
      .filter(stmt => stmt.result?.score)
      .map(stmt => ({
        activity: stmt.object.definition?.name['en-US'] || 'Unknown Assessment',
        activityId: stmt.object.id,
        score: Math.round(stmt.result.score.scaled * 100),
        rawScore: stmt.result.score.raw,
        maxScore: stmt.result.score.max,
        success: stmt.result.success,
        timestamp: new Date(stmt.timestamp),
        attempts: 1 // Will be aggregated later
      }));

    // Group by activity to count attempts
    const activityGroups = scores.reduce((groups, score) => {
      const key = score.activityId;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(score);
      return groups;
    }, {});

    // Process each activity group
    const processedScores = Object.values(activityGroups).map(group => {
      const latest = group.sort((a, b) => b.timestamp - a.timestamp)[0];
      latest.attempts = group.length;
      latest.bestScore = Math.max(...group.map(s => s.score));
      latest.firstAttempt = Math.min(...group.map(s => s.timestamp));
      return latest;
    });

    const scoreValues = processedScores.map(s => s.score);
    const average = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;
    const highest = Math.max(...scoreValues);
    const lowest = Math.min(...scoreValues);
    const passCount = processedScores.filter(s => s.success).length;
    const passRate = (passCount / processedScores.length) * 100;

    // Calculate trend (comparing first half vs second half)
    const trend = this.calculateScoreTrend(processedScores);

    return {
      scores: processedScores.sort((a, b) => b.timestamp - a.timestamp),
      average: Math.round(average),
      highest,
      lowest,
      totalAttempts: scores.length,
      passRate: Math.round(passRate),
      trend,
      distribution: this.calculateScoreDistribution(scoreValues)
    };
  }

  /**
   * Calculate score trend over time
   * @param {Array} scores - Processed scores array
   * @returns {string} - Trend direction
   */
  static calculateScoreTrend(scores) {
    if (scores.length < 2) return 'stable';
    
    const sortedByTime = scores.sort((a, b) => a.timestamp - b.timestamp);
    const midPoint = Math.floor(sortedByTime.length / 2);
    
    const firstHalf = sortedByTime.slice(0, midPoint);
    const secondHalf = sortedByTime.slice(midPoint);
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.score, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  /**
   * Calculate score distribution for charts
   * @param {Array} scoreValues - Array of score numbers
   * @returns {Object} - Distribution data
   */
  static calculateScoreDistribution(scoreValues) {
    const ranges = {
      'A (90-100)': 0,
      'B (80-89)': 0,
      'C (70-79)': 0,
      'D (60-69)': 0,
      'F (0-59)': 0
    };

    scoreValues.forEach(score => {
      if (score >= 90) ranges['A (90-100)']++;
      else if (score >= 80) ranges['B (80-89)']++;
      else if (score >= 70) ranges['C (70-79)']++;
      else if (score >= 60) ranges['D (60-69)']++;
      else ranges['F (0-59)']++;
    });

    return ranges;
  }

  /**
   * Generate learning timeline with activity clustering
   * @param {Array} statements - All xAPI statements
   * @returns {Array} - Timeline data for visualization
   */
  static generateTimelineData(statements) {
    if (!statements || statements.length === 0) return [];

    // Sort statements by timestamp
    const sortedStatements = statements.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Group activities by date
    const dailyActivities = {};
    
    sortedStatements.forEach(stmt => {
      const date = new Date(stmt.timestamp).toISOString().split('T')[0];
      
      if (!dailyActivities[date]) {
        dailyActivities[date] = {
          date,
          activities: [],
          totalActivities: 0,
          completions: 0,
          scores: [],
          videoTime: 0
        };
      }

      const activity = {
        id: stmt.object.id,
        name: stmt.object.definition?.name['en-US'] || 'Unknown Activity',
        verb: stmt.verb.display['en-US'] || stmt.verb.id.split('/').pop(),
        type: stmt.object.definition?.type?.split('/').pop() || 'activity',
        timestamp: new Date(stmt.timestamp),
        success: stmt.result?.success,
        score: stmt.result?.score ? Math.round(stmt.result.score.scaled * 100) : null
      };

      dailyActivities[date].activities.push(activity);
      dailyActivities[date].totalActivities++;

      // Count completions
      if (stmt.verb.id === 'http://adlnet.gov/expapi/verbs/completed') {
        dailyActivities[date].completions++;
      }

      // Collect scores
      if (activity.score !== null) {
        dailyActivities[date].scores.push(activity.score);
      }

      // Calculate video time
      if (stmt.object.definition?.type === 'http://coursera.org/xapi/activity-types/video' && 
          stmt.result?.duration) {
        const duration = this.parseDuration(stmt.result.duration);
        dailyActivities[date].videoTime += duration;
      }
    });

    // Convert to array and calculate daily averages
    return Object.values(dailyActivities).map(day => ({
      ...day,
      averageScore: day.scores.length > 0 
        ? Math.round(day.scores.reduce((sum, score) => sum + score, 0) / day.scores.length)
        : null,
      videoTimeFormatted: this.formatDuration(day.videoTime),
      activityTypes: this.countActivityTypes(day.activities)
    }));
  }

  /**
   * Parse ISO 8601 duration to seconds
   * @param {string} duration - ISO 8601 duration string
   * @returns {number} - Duration in seconds
   */
  static parseDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Format duration seconds to human readable
   * @param {number} seconds - Duration in seconds
   * @returns {string} - Formatted duration
   */
  static formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return ${hours}h m;
    } else if (minutes > 0) {
      return ${minutes}m s;
    } else {
      return ${secs}s;
    }
  }

  /**
   * Count activity types for a day
   * @param {Array} activities - Activities for a specific day
   * @returns {Object} - Count of each activity type
   */
  static countActivityTypes(activities) {
    return activities.reduce((counts, activity) => {
      counts[activity.type] = (counts[activity.type] || 0) + 1;
      return counts;
    }, {});
  }

  /**
   * Calculate engagement metrics
   * @param {Array} statements - All xAPI statements
   * @returns {Object} - Engagement analytics
   */
  static calculateEngagementMetrics(statements) {
    const videoStatements = statements.filter(stmt => 
      stmt.object.definition?.type === 'http://coursera.org/xapi/activity-types/video'
    );

    const totalVideoTime = videoStatements.reduce((total, stmt) => {
      if (stmt.result?.duration) {
        return total + this.parseDuration(stmt.result.duration);
      }
      return total;
    }, 0);

    // Calculate study sessions (activities within 1 hour of each other)
    const sessions = this.calculateStudySessions(statements);
    
    // Calculate streak (consecutive days with activity)
    const streak = this.calculateLearningStreak(statements);

    return {
      totalVideoTime: totalVideoTime,
      totalVideoTimeFormatted: this.formatDuration(totalVideoTime),
      videoInteractions: videoStatements.length,
      studySessions: sessions.length,
      averageSessionLength: sessions.length > 0 
        ? this.formatDuration(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length)
        : '0m',
      longestSession: sessions.length > 0 
        ? this.formatDuration(Math.max(...sessions.map(s => s.duration)))
        : '0m',
      currentStreak: streak.current,
      longestStreak: streak.longest,
      totalActiveDays: streak.totalDays
    };
  }

  /**
   * Calculate study sessions from statements
   * @param {Array} statements - All xAPI statements
   * @returns {Array} - Study sessions
   */
  static calculateStudySessions(statements) {
    if (statements.length === 0) return [];

    const sortedStatements = statements.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    const sessions = [];
    let currentSession = {
      start: new Date(sortedStatements[0].timestamp),
      end: new Date(sortedStatements[0].timestamp),
      activities: 1
    };

    for (let i = 1; i < sortedStatements.length; i++) {
      const currentTime = new Date(sortedStatements[i].timestamp);
      const timeDiff = currentTime - currentSession.end;
      
      // If less than 1 hour gap, extend current session
      if (timeDiff <= 3600000) { // 1 hour in milliseconds
        currentSession.end = currentTime;
        currentSession.activities++;
      } else {
        // End current session and start new one
        currentSession.duration = (currentSession.end - currentSession.start) / 1000;
        sessions.push(currentSession);
        
        currentSession = {
          start: currentTime,
          end: currentTime,
          activities: 1
        };
      }
    }

    // Add the last session
    currentSession.duration = (currentSession.end - currentSession.start) / 1000;
    sessions.push(currentSession);

    return sessions;
  }

  /**
   * Calculate learning streak
   * @param {Array} statements - All xAPI statements
   * @returns {Object} - Streak information
   */
  static calculateLearningStreak(statements) {
    if (statements.length === 0) {
      return { current: 0, longest: 0, totalDays: 0 };
    }

    // Get unique activity dates
    const activityDates = [...new Set(
      statements.map(stmt => new Date(stmt.timestamp).toISOString().split('T')[0])
    )].sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let streakCount = 1;

    for (let i = 1; i < activityDates.length; i++) {
      const prevDate = new Date(activityDates[i - 1]);
      const currentDate = new Date(activityDates[i]);
      const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        streakCount++;
      } else {
        longestStreak = Math.max(longestStreak, streakCount);
        streakCount = 1;
      }
    }

    longestStreak = Math.max(longestStreak, streakCount);

    // Calculate current streak (from most recent activity to today)
    const today = new Date().toISOString().split('T')[0];
    const lastActivityDate = activityDates[activityDates.length - 1];
    const daysSinceLastActivity = (new Date(today) - new Date(lastActivityDate)) / (1000 * 60 * 60 * 24);

    if (daysSinceLastActivity <= 1) {
      // Count backwards from last activity date
      for (let i = activityDates.length - 1; i > 0; i--) {
        const prevDate = new Date(activityDates[i - 1]);
        const currentDate = new Date(activityDates[i]);
        const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);

        if (dayDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
      currentStreak++; // Include the last activity day
    }

    return {
      current: currentStreak,
      longest: longestStreak,
      totalDays: activityDates.length
    };
  }
}
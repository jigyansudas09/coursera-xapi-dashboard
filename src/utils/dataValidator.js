/**
 * Data Validation Utilities
 * Validates and sanitizes xAPI data
 */
export class DataValidator {

  /**
   * Validate xAPI statement structure
   * @param {Object} statement - xAPI statement to validate
   * @returns {Object} - Validation result
   */
  static validateStatement(statement) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!statement.actor) {
      errors.push('Missing required field: actor');
    } else {
      if (!statement.actor.mbox && !statement.actor.account) {
        errors.push('Actor must have mbox or account');
      }
    }

    if (!statement.verb) {
      errors.push('Missing required field: verb');
    } else {
      if (!statement.verb.id) {
        errors.push('Verb must have id');
      }
    }

    if (!statement.object) {
      errors.push('Missing required field: object');
    } else {
      if (!statement.object.id) {
        errors.push('Object must have id');
      }
    }

    // Optional but recommended fields
    if (!statement.timestamp) {
      warnings.push('Missing timestamp - will be set by LRS');
    }

    if (statement.result?.score) {
      const score = statement.result.score;
      if (score.scaled && (score.scaled < -1 || score.scaled > 1)) {
        errors.push('Scaled score must be between -1 and 1');
      }
      if (score.raw !== undefined && score.max !== undefined && score.raw > score.max) {
        errors.push('Raw score cannot exceed max score');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitize and normalize statement data
   * @param {Object} statement - Raw statement
   * @returns {Object} - Sanitized statement
   */
  static sanitizeStatement(statement) {
    const sanitized = { ...statement };

    // Ensure timestamp is ISO 8601
    if (sanitized.timestamp && typeof sanitized.timestamp === 'string') {
      try {
        sanitized.timestamp = new Date(sanitized.timestamp).toISOString();
      } catch (e) {
        delete sanitized.timestamp; // Let LRS set it
      }
    }

    // Normalize verb display
    if (sanitized.verb?.display) {
      Object.keys(sanitized.verb.display).forEach(lang => {
        sanitized.verb.display[lang] = sanitized.verb.display[lang].trim();
      });
    }

    // Normalize object definition
    if (sanitized.object?.definition?.name) {
      Object.keys(sanitized.object.definition.name).forEach(lang => {
        sanitized.object.definition.name[lang] = sanitized.object.definition.name[lang].trim();
      });
    }

    return sanitized;
  }

  /**
   * Validate dashboard data structure
   * @param {Object} data - Dashboard data to validate
   * @returns {Object} - Validation result
   */
  static validateDashboardData(data) {
    const errors = [];
    const warnings = [];

    // Check required sections
    const requiredSections = ['overview', 'modules', 'assessments', 'engagement', 'timeline'];
    requiredSections.forEach(section => {
      if (!data[section]) {
        errors.push(Missing required section: );
      }
    });

    // Validate overview section
    if (data.overview) {
      if (typeof data.overview.totalStatements !== 'number') {
        warnings.push('Invalid totalStatements in overview');
      }
      if (data.overview.userEmail && !this.isValidEmail(data.overview.userEmail)) {
        errors.push('Invalid email format in overview');
      }
    }

    // Validate modules section
    if (data.modules) {
      if (!Array.isArray(data.modules.completed)) {
        errors.push('modules.completed must be an array');
      }
      if (typeof data.modules.completionCount !== 'number') {
        warnings.push('Invalid completionCount in modules');
      }
    }

    // Validate timeline data
    if (data.timeline && Array.isArray(data.timeline)) {
      data.timeline.forEach((day, index) => {
        if (!day.date || !this.isValidDate(day.date)) {
          warnings.push(Invalid date in timeline[]);
        }
        if (typeof day.totalActivities !== 'number') {
          warnings.push(Invalid totalActivities in timeline[]);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - Is valid email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate date format
   * @param {string} date - Date string to validate
   * @returns {boolean} - Is valid date
   */
  static isValidDate(date) {
    return !isNaN(Date.parse(date));
  }

  /**
   * Clean and validate score data
   * @param {Array} scores - Array of score objects
   * @returns {Array} - Cleaned score data
   */
  static cleanScoreData(scores) {
    return scores
      .filter(score => {
        // Remove invalid scores
        return score.score !== null && 
               score.score !== undefined && 
               !isNaN(score.score) &&
               score.score >= 0 && 
               score.score <= 100;
      })
      .map(score => ({
        ...score,
        score: Math.round(score.score), // Ensure integer scores
        timestamp: new Date(score.timestamp) // Ensure Date object
      }));
  }

  /**
   * Validate and clean timeline data
   * @param {Array} timeline - Timeline data array
   * @returns {Array} - Cleaned timeline data
   */
  static cleanTimelineData(timeline) {
    return timeline
      .filter(day => day.date && this.isValidDate(day.date))
      .map(day => ({
        ...day,
        totalActivities: Math.max(0, parseInt(day.totalActivities) || 0),
        completions: Math.max(0, parseInt(day.completions) || 0),
        videoTime: Math.max(0, parseInt(day.videoTime) || 0)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Detect and handle data anomalies
   * @param {Object} data - Data to analyze
   * @returns {Object} - Anomaly report
   */
  static detectAnomalies(data) {
    const anomalies = [];

    // Check for suspicious score patterns
    if (data.scores && data.scores.scores) {
      const scores = data.scores.scores.map(s => s.score);
      
      // All perfect scores (suspicious)
      if (scores.length > 5 && scores.every(s => s === 100)) {
        anomalies.push({
          type: 'suspicious_scores',
          message: 'All scores are perfect (100%) - this may indicate data issues',
          severity: 'medium'
        });
      }

      // Impossible score improvements
      const sortedScores = [...scores].sort((a, b) => a - b);
      if (sortedScores.length > 1) {
        const improvement = sortedScores[sortedScores.length - 1] - sortedScores[0];
        if (improvement > 50) {
          anomalies.push({
            type: 'large_improvement',
            message: Score improved by % - verify data accuracy,
            severity: 'low'
          });
        }
      }
    }

    // Check for unusual activity patterns
    if (data.timeline) {
      const activities = data.timeline.map(d => d.totalActivities);
      const maxActivities = Math.max(...activities);
      const avgActivities = activities.reduce((sum, a) => sum + a, 0) / activities.length;

      if (maxActivities > avgActivities * 5) {
        anomalies.push({
          type: 'activity_spike',
          message: Unusually high activity day ( activities),
          severity: 'low'
        });
      }
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies,
      riskLevel: this.calculateRiskLevel(anomalies)
    };
  }

  /**
   * Calculate overall risk level from anomalies
   * @param {Array} anomalies - Array of anomaly objects
   * @returns {string} - Risk level
   */
  static calculateRiskLevel(anomalies) {
    if (anomalies.length === 0) return 'none';
    
    const severityCounts = anomalies.reduce((counts, anomaly) => {
      counts[anomaly.severity] = (counts[anomaly.severity] || 0) + 1;
      return counts;
    }, {});

    if (severityCounts.high > 0) return 'high';
    if (severityCounts.medium > 1) return 'high';
    if (severityCounts.medium > 0) return 'medium';
    return 'low';
  }
}
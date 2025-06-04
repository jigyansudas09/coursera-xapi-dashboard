/**
 * xAPI Statement Builder Utility
 * Helps create properly formatted xAPI statements
 */
export class XAPIStatementBuilder {
  constructor() {
    this.statement = {};
  }

  /**
   * Set the actor (who performed the action)
   * @param {string} name - Actor's name
   * @param {string} email - Actor's email
   * @returns {XAPIStatementBuilder} - Builder instance for chaining
   */
  setActor(name, email) {
    this.statement.actor = {
      name: name,
      mbox: mailto:,
      objectType: 'Agent'
    };
    return this;
  }

  /**
   * Set the verb (what action was performed)
   * @param {string} verbId - Verb IRI
   * @param {string} display - Human-readable verb display
   * @returns {XAPIStatementBuilder} - Builder instance for chaining
   */
  setVerb(verbId, display) {
    this.statement.verb = {
      id: verbId,
      display: {
        'en-US': display
      }
    };
    return this;
  }

  /**
   * Set the object (what was acted upon)
   * @param {string} activityId - Activity IRI
   * @param {string} name - Activity name
   * @param {string} description - Activity description
   * @param {string} type - Activity type IRI
   * @returns {XAPIStatementBuilder} - Builder instance for chaining
   */
  setObject(activityId, name, description, type) {
    this.statement.object = {
      id: activityId,
      definition: {
        name: {
          'en-US': name
        },
        description: {
          'en-US': description
        },
        type: type
      },
      objectType: 'Activity'
    };
    return this;
  }

  /**
   * Set the result (outcome of the action)
   * @param {Object} options - Result options
   * @returns {XAPIStatementBuilder} - Builder instance for chaining
   */
  setResult(options = {}) {
    this.statement.result = {};
    
    if (options.score !== undefined) {
      this.statement.result.score = {
        scaled: options.score / 100, // Convert percentage to 0-1 scale
        raw: options.score,
        max: options.maxScore || 100,
        min: options.minScore || 0
      };
    }
    
    if (options.success !== undefined) {
      this.statement.result.success = options.success;
    }
    
    if (options.completion !== undefined) {
      this.statement.result.completion = options.completion;
    }
    
    if (options.duration) {
      this.statement.result.duration = options.duration; // ISO 8601 format
    }
    
    return this;
  }

  /**
   * Set the context (additional information)
   * @param {Object} options - Context options
   * @returns {XAPIStatementBuilder} - Builder instance for chaining
   */
  setContext(options = {}) {
    this.statement.context = {};
    
    if (options.registration) {
      this.statement.context.registration = options.registration;
    }
    
    if (options.instructor) {
      this.statement.context.instructor = {
        name: options.instructor.name,
        mbox: mailto:,
        objectType: 'Agent'
      };
    }
    
    if (options.contextActivities) {
      this.statement.context.contextActivities = options.contextActivities;
    }
    
    return this;
  }

  /**
   * Set timestamp
   * @param {Date|string} timestamp - Statement timestamp
   * @returns {XAPIStatementBuilder} - Builder instance for chaining
   */
  setTimestamp(timestamp) {
    this.statement.timestamp = timestamp instanceof Date 
      ? timestamp.toISOString() 
      : timestamp;
    return this;
  }

  /**
   * Build and return the xAPI statement
   * @returns {Object} - Complete xAPI statement
   */
  build() {
    // Add timestamp if not set
    if (!this.statement.timestamp) {
      this.statement.timestamp = new Date().toISOString();
    }
    
    return { ...this.statement };
  }

  /**
   * Reset the builder for reuse
   * @returns {XAPIStatementBuilder} - Builder instance for chaining
   */
  reset() {
    this.statement = {};
    return this;
  }
}

// Predefined statement templates for common Coursera activities
export const CourseraStatements = {
  moduleCompleted: (actor, moduleId, moduleName) => {
    return new XAPIStatementBuilder()
      .setActor(actor.name, actor.email)
      .setVerb('http://adlnet.gov/expapi/verbs/completed', 'completed')
      .setObject(
        moduleId,
        moduleName,
        Completed module: ,
        'http://coursera.org/xapi/activity-types/module'
      )
      .setResult({ completion: true, success: true })
      .build();
  },

  quizScored: (actor, quizId, quizName, score, maxScore) => {
    return new XAPIStatementBuilder()
      .setActor(actor.name, actor.email)
      .setVerb('http://adlnet.gov/expapi/verbs/scored', 'scored')
      .setObject(
        quizId,
        quizName,
        Quiz: ,
        'http://coursera.org/xapi/activity-types/quiz'
      )
      .setResult({ 
        score: score, 
        maxScore: maxScore,
        success: score >= (maxScore * 0.7), // 70% pass rate
        completion: true 
      })
      .build();
  },

  videoWatched: (actor, videoId, videoName, duration) => {
    return new XAPIStatementBuilder()
      .setActor(actor.name, actor.email)
      .setVerb('http://adlnet.gov/expapi/verbs/experienced', 'experienced')
      .setObject(
        videoId,
        videoName,
        Video: ,
        'http://coursera.org/xapi/activity-types/video'
      )
      .setResult({ 
        completion: true,
        duration: duration // ISO 8601 format like "PT30M"
      })
      .build();
  }
};
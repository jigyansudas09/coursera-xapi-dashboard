import XAPIService from './xapiService.js';

/**
 * Coursera-specific xAPI Service
 * Handles Coursera Enterprise xAPI data retrieval and processing
 */
class CourseraXAPIService extends XAPIService {
  constructor(endpoint, username, password) {
    super(endpoint, username, password);
    
    // Coursera-specific xAPI verb definitions
    this.verbs = {
      COMPLETED: 'http://adlnet.gov/expapi/verbs/completed',
      EXPERIENCED: 'http://adlnet.gov/expapi/verbs/experienced',
      SCORED: 'http://adlnet.gov/expapi/verbs/scored',
      ATTEMPTED: 'http://adlnet.gov/expapi/verbs/attempted',
      ANSWERED: 'http://adlnet.gov/expapi/verbs/answered',
      PROGRESSED: 'http://adlnet.gov/expapi/verbs/progressed'
    };

    // Coursera activity types
    this.activityTypes = {
      COURSE: 'http://coursera.org/xapi/activity-types/course',
      MODULE: 'http://coursera.org/xapi/activity-types/module',
      LESSON: 'http://coursera.org/xapi/activity-types/lesson',
      VIDEO: 'http://coursera.org/xapi/activity-types/video',
      QUIZ: 'http://coursera.org/xapi/activity-types/quiz',
      ASSIGNMENT: 'http://coursera.org/xapi/activity-types/assignment',
      PEER_REVIEW: 'http://coursera.org/xapi/activity-types/peer-review'
    };
  }

  /**
   * Get all course progress data for a user
   * @param {string} userEmail - User's email address
   * @param {string} courseId - Coursera course ID
   * @returns {Promise<Object>} - Complete course progress data
   */
  async getCourseProgress(userEmail, courseId) {
    try {
      const statements = await this.getActorActivityStatements(userEmail, courseId);
      
      return {
        totalStatements: statements.statements.length,
        statements: statements.statements,
        hasMore: statements.more,
        raw: statements
      };
    } catch (error) {
      throw new Error(Failed to get course progress: );
    }
  }

  /**
   * Get completed modules for a course
   * @param {string} userEmail - User's email address
   * @param {string} courseId - Course ID
   * @returns {Promise<Array>} - Array of completed module statements
   */
  async getModuleCompletions(userEmail, courseId) {
    try {
      const courseData = await this.getCourseProgress(userEmail, courseId);
      
      return courseData.statements.filter(stmt => 
        stmt.verb.id === this.verbs.COMPLETED &&
        stmt.object.definition?.type === this.activityTypes.MODULE
      );
    } catch (error) {
      throw new Error(Failed to get module completions: );
    }
  }

  /**
   * Get quiz scores and attempts
   * @param {string} userEmail - User's email address
   * @param {string} courseId - Course ID
   * @returns {Promise<Array>} - Array of quiz score statements
   */
  async getQuizScores(userEmail, courseId) {
    try {
      const courseData = await this.getCourseProgress(userEmail, courseId);
      
      return courseData.statements.filter(stmt => 
        (stmt.verb.id === this.verbs.SCORED || stmt.verb.id === this.verbs.ANSWERED) &&
        stmt.object.definition?.type === this.activityTypes.QUIZ &&
        stmt.result?.score
      );
    } catch (error) {
      throw new Error(Failed to get quiz scores: );
    }
  }

  /**
   * Get video interaction data
   * @param {string} userEmail - User's email address
   * @param {string} courseId - Course ID
   * @returns {Promise<Array>} - Array of video interaction statements
   */
  async getVideoInteractions(userEmail, courseId) {
    try {
      const courseData = await this.getCourseProgress(userEmail, courseId);
      
      return courseData.statements.filter(stmt => 
        stmt.verb.id === this.verbs.EXPERIENCED &&
        stmt.object.definition?.type === this.activityTypes.VIDEO
      );
    } catch (error) {
      throw new Error(Failed to get video interactions: );
    }
  }

  /**
   * Get assignment submissions and grades
   * @param {string} userEmail - User's email address
   * @param {string} courseId - Course ID
   * @returns {Promise<Array>} - Array of assignment statements
   */
  async getAssignmentData(userEmail, courseId) {
    try {
      const courseData = await this.getCourseProgress(userEmail, courseId);
      
      return courseData.statements.filter(stmt => 
        (stmt.verb.id === this.verbs.COMPLETED || stmt.verb.id === this.verbs.SCORED) &&
        stmt.object.definition?.type === this.activityTypes.ASSIGNMENT
      );
    } catch (error) {
      throw new Error(Failed to get assignment data: );
    }
  }

  /**
   * Get learning timeline (chronological activity)
   * @param {string} userEmail - User's email address
   * @param {string} courseId - Course ID
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Promise<Array>} - Chronologically sorted statements
   */
  async getLearningTimeline(userEmail, courseId, days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      
      const params = {
        agent: JSON.stringify({
          mbox: mailto:,
          objectType: 'Agent'
        }),
        activity: courseId,
        related_activities: true,
        since: since.toISOString(),
        limit: 200
      };
      
      const statements = await this.getStatements(params);
      
      // Sort by timestamp (newest first)
      return statements.statements.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
    } catch (error) {
      throw new Error(Failed to get learning timeline: );
    }
  }

  /**
   * Get comprehensive dashboard data
   * @param {string} userEmail - User's email address
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} - Complete dashboard data
   */
  async getDashboardData(userEmail, courseId) {
    try {
      const [
        courseProgress,
        moduleCompletions,
        quizScores,
        videoInteractions,
        assignmentData,
        timeline
      ] = await Promise.all([
        this.getCourseProgress(userEmail, courseId),
        this.getModuleCompletions(userEmail, courseId),
        this.getQuizScores(userEmail, courseId),
        this.getVideoInteractions(userEmail, courseId),
        this.getAssignmentData(userEmail, courseId),
        this.getLearningTimeline(userEmail, courseId)
      ]);

      return {
        overview: {
          totalStatements: courseProgress.totalStatements,
          lastActivity: timeline[0]?.timestamp || null,
          courseId,
          userEmail
        },
        modules: {
          completed: moduleCompletions,
          completionCount: moduleCompletions.length
        },
        assessments: {
          quizzes: quizScores,
          assignments: assignmentData,
          totalAssessments: quizScores.length + assignmentData.length
        },
        engagement: {
          videoInteractions: videoInteractions,
          totalVideoTime: this.calculateVideoTime(videoInteractions)
        },
        timeline: timeline.slice(0, 50) // Latest 50 activities
      };
    } catch (error) {
      throw new Error(Failed to get dashboard data: );
    }
  }

  /**
   * Calculate total video watch time from interactions
   * @param {Array} videoInteractions - Video interaction statements
   * @returns {number} - Total time in seconds
   */
  calculateVideoTime(videoInteractions) {
    return videoInteractions.reduce((total, stmt) => {
      const duration = stmt.result?.duration;
      if (duration) {
        // Parse ISO 8601 duration (PT30S = 30 seconds)
        const match = duration.match(/PT(\d+)S/);
        return total + (match ? parseInt(match[1]) : 0);
      }
      return total;
    }, 0);
  }
}

export default CourseraXAPIService;
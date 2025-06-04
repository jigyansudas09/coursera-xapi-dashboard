import axios from 'axios';

/**
 * Base xAPI Service for handling Learning Record Store (LRS) communication
 * Follows xAPI 1.0.3 specification
 */
class XAPIService {
  constructor(endpoint, username, password) {
    this.endpoint = endpoint;
    this.username = username;
    this.password = password;
    
    // Create base64 encoded auth string
    this.auth = btoa(${username}:);
    
    // Configure axios client with xAPI headers
    this.client = axios.create({
      baseURL: endpoint,
      headers: {
        'Authorization': Basic ,
        'Content-Type': 'application/json',
        'X-Experience-API-Version': '1.0.3'
      },
      timeout: 10000 // 10 second timeout
    });

    // Add request/response interceptors for debugging
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log('xAPI Request:', {
          method: config.method,
          url: config.url,
          params: config.params
        });
        return config;
      },
      (error) => {
        console.error('xAPI Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log('xAPI Response:', {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        console.error('xAPI Response Error:', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get xAPI statements from LRS
   * @param {Object} params - Query parameters for filtering statements
   * @returns {Promise<Object>} - Statement result object
   */
  async getStatements(params = {}) {
    try {
      const response = await this.client.get('/statements', { params });
      return response.data;
    } catch (error) {
      throw new Error(Failed to fetch xAPI statements: );
    }
  }

  /**
   * Send a single xAPI statement to LRS
   * @param {Object} statement - xAPI statement object
   * @returns {Promise<string>} - Statement ID
   */
  async sendStatement(statement) {
    try {
      const response = await this.client.post('/statements', statement);
      return response.data;
    } catch (error) {
      throw new Error(Failed to send xAPI statement: );
    }
  }

  /**
   * Get statements for a specific actor and activity
   * @param {string} actorEmail - Actor's email address
   * @param {string} activityId - Activity ID (course/module)
   * @returns {Promise<Object>} - Filtered statements
   */
  async getActorActivityStatements(actorEmail, activityId) {
    const params = {
      agent: JSON.stringify({
        mbox: mailto:,
        objectType: 'Agent'
      }),
      activity: activityId,
      related_activities: true,
      limit: 100
    };
    
    return await this.getStatements(params);
  }

  /**
   * Test LRS connection
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    try {
      await this.client.get('/about');
      return true;
    } catch (error) {
      console.error('LRS connection test failed:', error.message);
      return false;
    }
  }
}

export default XAPIService;
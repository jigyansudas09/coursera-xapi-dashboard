/**
 * xAPI Configuration Manager
 * Handles environment variables and xAPI connection settings
 */
class XAPIConfig {
  constructor() {
    this.config = {
      endpoint: import.meta.env.VITE_XAPI_ENDPOINT,
      username: import.meta.env.VITE_XAPI_USERNAME,
      password: import.meta.env.VITE_XAPI_PASSWORD,
      courseraApiKey: import.meta.env.VITE_COURSERA_API_KEY
    };

    this.validateConfig();
  }

  validateConfig() {
    const required = ['endpoint', 'username', 'password'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      console.warn(Missing xAPI configuration: );
      console.warn('Please check your .env file and ensure all required variables are set.');
    }
  }

  getConfig() {
    return { ...this.config };
  }

  isConfigured() {
    return !!(this.config.endpoint && this.config.username && this.config.password);
  }

  getEndpoint() {
    return this.config.endpoint;
  }

  getCredentials() {
    return {
      username: this.config.username,
      password: this.config.password
    };
  }

  // Default test configuration for development
  getTestConfig() {
    return {
      endpoint: 'https://lrs.adlnet.gov/xapi/',
      username: 'test',
      password: 'test'
    };
  }
}

export default new XAPIConfig();
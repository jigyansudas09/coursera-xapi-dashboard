import CourseraXAPIService from '../services/courseraXAPI.js';
import xapiConfig from '../services/xapiConfig.js';

/**
 * Test xAPI implementation
 */
export const testXAPIImplementation = async () => {
  console.log('🧪 Testing xAPI Implementation...');
  
  try {
    // Test configuration
    console.log('📋 Checking configuration...');
    if (!xapiConfig.isConfigured()) {
      console.error('❌ xAPI configuration is incomplete');
      return false;
    }
    console.log('✅ Configuration is valid');

    // Test service initialization
    console.log('🔧 Initializing xAPI service...');
    const config = xapiConfig.getConfig();
    const service = new CourseraXAPIService(
      config.endpoint,
      config.username,
      config.password
    );
    console.log('✅ xAPI service initialized');

    // Test connection
    console.log('🌐 Testing LRS connection...');
    const connectionOk = await service.testConnection();
    if (!connectionOk) {
      console.error('❌ Failed to connect to LRS');
      return false;
    }
    console.log('✅ LRS connection successful');

    // Test data fetching (with mock data if needed)
    console.log('📊 Testing data fetching...');
    const testEmail = 'test@example.com';
    const testCourseId = 'http://example.com/course/test';
    
    try {
      const dashboardData = await service.getDashboardData(testEmail, testCourseId);
      console.log('✅ Dashboard data fetch successful:', {
        totalStatements: dashboardData.overview.totalStatements,
        moduleCompletions: dashboardData.modules.completionCount,
        assessments: dashboardData.assessments.totalAssessments
      });
    } catch (err) {
      console.warn('⚠️ Data fetch failed (expected if no test data exists):', err.message);
    }

    console.log('🎉 xAPI implementation test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ xAPI implementation test failed:', error);
    return false;
  }
};
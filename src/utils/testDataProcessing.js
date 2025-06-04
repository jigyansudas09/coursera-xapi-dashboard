import { CourseDataProcessor } from './dataProcessor.js';
import { ChartDataTransformer } from './chartDataTransformer.js';
import { DataAggregator } from './dataAggregator.js';
import { DataValidator } from './dataValidator.js';

/**
 * Test data processing functionality
 */
export const testDataProcessing = () => {
  console.log('🧪 Testing Data Processing...');

  // Mock xAPI statements for testing
  const mockStatements = [
    {
      actor: { name: 'John Doe', mbox: 'mailto:john@example.com' },
      verb: { id: 'http://adlnet.gov/expapi/verbs/completed', display: { 'en-US': 'completed' } },
      object: {
        id: 'http://example.com/course/module1',
        definition: {
          name: { 'en-US': 'Introduction to JavaScript' },
          type: 'http://coursera.org/xapi/activity-types/module'
        }
      },
      result: { completion: true, success: true },
      timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      actor: { name: 'John Doe', mbox: 'mailto:john@example.com' },
      verb: { id: 'http://adlnet.gov/expapi/verbs/scored', display: { 'en-US': 'scored' } },
      object: {
        id: 'http://example.com/course/quiz1',
        definition: {
          name: { 'en-US': 'JavaScript Basics Quiz' },
          type: 'http://coursera.org/xapi/activity-types/quiz'
        }
      },
      result: {
        score: { scaled: 0.85, raw: 85, max: 100 },
        success: true,
        completion: true
      },
      timestamp: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
    }
  ];

  try {
    // Test progress calculation
    console.log('📊 Testing progress calculation...');
    const progress = CourseDataProcessor.calculateProgress(mockStatements);
    console.log('✅ Progress:', progress);

    // Test score aggregation
    console.log('📈 Testing score aggregation...');
    const scores = CourseDataProcessor.aggregateScores(mockStatements.filter(s => s.result?.score));
    console.log('✅ Scores:', scores);

    // Test timeline generation
    console.log('📅 Testing timeline generation...');
    const timeline = CourseDataProcessor.generateTimelineData(mockStatements);
    console.log('✅ Timeline:', timeline);

    // Test chart transformations
    console.log('📊 Testing chart transformations...');
    const progressChart = ChartDataTransformer.transformProgressChart(progress);
    const scoreChart = ChartDataTransformer.transformScoreChart(scores);
    console.log('✅ Charts generated successfully');

    // Test data validation
    console.log('✅ Testing data validation...');
    const validation = DataValidator.validateStatement(mockStatements[0]);
    console.log('✅ Validation:', validation);

    console.log('🎉 All data processing tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Data processing test failed:', error);
    return false;
  }
};
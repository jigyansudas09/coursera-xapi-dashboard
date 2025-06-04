/**
 * Chart Data Transformer
 * Converts processed data into chart-specific formats
 */
export class ChartDataTransformer {

  /**
   * Transform progress data for doughnut chart
   * @param {Object} progressData - Progress statistics
   * @returns {Object} - Chart.js compatible data
   */
  static transformProgressChart(progressData) {
    return {
      labels: ['Completed', 'Remaining'],
      datasets: [{
        data: [progressData.completed, progressData.remaining],
        backgroundColor: [
          'rgba(168, 85, 247, 0.8)', // Purple for completed
          'rgba(71, 85, 105, 0.3)'   // Gray for remaining
        ],
        borderColor: [
          'rgba(168, 85, 247, 1)',
          'rgba(71, 85, 105, 0.5)'
        ],
        borderWidth: 2,
        cutout: '70%'
      }],
      centerText: {
        percentage: progressData.percentage,
        label: 'Complete'
      }
    };
  }

  /**
   * Transform score data for line chart
   * @param {Object} scoreData - Score analytics
   * @returns {Object} - Chart.js compatible data
   */
  static transformScoreChart(scoreData) {
    const sortedScores = scoreData.scores.sort((a, b) => a.timestamp - b.timestamp);
    
    return {
      labels: sortedScores.map(score => 
        score.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [{
        label: 'Quiz Scores',
        data: sortedScores.map(score => score.score),
        borderColor: 'rgba(236, 72, 153, 1)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(236, 72, 153, 1)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }],
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    };
  }

  /**
   * Transform timeline data for activity chart
   * @param {Array} timelineData - Timeline activities
   * @returns {Object} - Chart.js compatible data
   */
  static transformTimelineChart(timelineData) {
    const last30Days = timelineData.slice(-30);
    
    return {
      labels: last30Days.map(day => 
        new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Total Activities',
          data: last30Days.map(day => day.totalActivities),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        },
        {
          label: 'Completions',
          data: last30Days.map(day => day.completions),
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 2
        }
      ]
    };
  }

  /**
   * Transform score distribution for bar chart
   * @param {Object} distribution - Score distribution data
   * @returns {Object} - Chart.js compatible data
   */
  static transformDistributionChart(distribution) {
    return {
      labels: Object.keys(distribution),
      datasets: [{
        label: 'Number of Scores',
        data: Object.values(distribution),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // A - Green
          'rgba(59, 130, 246, 0.8)',  // B - Blue
          'rgba(251, 191, 36, 0.8)',  // C - Yellow
          'rgba(249, 115, 22, 0.8)',  // D - Orange
          'rgba(239, 68, 68, 0.8)'    // F - Red
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2
      }]
    };
  }

  /**
   * Transform engagement data for radar chart
   * @param {Object} engagementData - Engagement metrics
   * @returns {Object} - Chart.js compatible data
   */
  static transformEngagementRadar(engagementData) {
    // Normalize metrics to 0-100 scale for radar chart
    const maxVideoTime = 7200; // 2 hours as max reference
    const maxSessions = 50;
    const maxStreak = 30;
    
    const videoScore = Math.min((engagementData.totalVideoTime / maxVideoTime) * 100, 100);
    const sessionScore = Math.min((engagementData.studySessions / maxSessions) * 100, 100);
    const streakScore = Math.min((engagementData.currentStreak / maxStreak) * 100, 100);
    const consistencyScore = Math.min((engagementData.totalActiveDays / 100) * 100, 100);
    
    return {
      labels: [
        'Video Engagement',
        'Study Sessions',
        'Learning Streak',
        'Consistency',
        'Activity Variety'
      ],
      datasets: [{
        label: 'Engagement Level',
        data: [videoScore, sessionScore, streakScore, consistencyScore, 75], // 75 as placeholder for variety
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(168, 85, 247, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(168, 85, 247, 1)'
      }]
    };
  }

  /**
   * Transform data for heatmap visualization
   * @param {Array} timelineData - Timeline data
   * @returns {Array} - Heatmap data points
   */
  static transformHeatmapData(timelineData) {
    const heatmapData = [];
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    // Create data points for each day in the past year
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      const dayData = timelineData.find(day => day.date === dateString);
      
      heatmapData.push({
        date: dateString,
        count: dayData ? dayData.totalActivities : 0,
        level: this.getHeatmapLevel(dayData ? dayData.totalActivities : 0)
      });
    }
    
    return heatmapData;
  }

  /**
   * Get heatmap intensity level
   * @param {number} count - Activity count
   * @returns {number} - Intensity level (0-4)
   */
  static getHeatmapLevel(count) {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 10) return 3;
    return 4;
  }

  /**
   * Transform data for calendar view
   * @param {Array} timelineData - Timeline data
   * @returns {Object} - Calendar data by month
   */
  static transformCalendarData(timelineData) {
    const calendarData = {};
    
    timelineData.forEach(day => {
      const date = new Date(day.date);
      const monthKey = ${date.getFullYear()}-;
      
      if (!calendarData[monthKey]) {
        calendarData[monthKey] = {
          month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          days: {}
        };
      }
      
      calendarData[monthKey].days[day.date] = {
        activities: day.totalActivities,
        completions: day.completions,
        averageScore: day.averageScore,
        videoTime: day.videoTimeFormatted,
        level: this.getHeatmapLevel(day.totalActivities)
      };
    });
    
    return calendarData;
  }
}
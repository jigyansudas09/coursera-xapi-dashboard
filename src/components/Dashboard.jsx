import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  Clock, 
  User, 
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useProcessedData } from '../hooks/useProcessedData';
import DashboardHeader from './DashboardHeader';
import StatCard from './StatCard';
import ProgressChart from './charts/ProgressChart';
import ScoreChart from './charts/ScoreChart';
import TimelineChart from './charts/TimelineChart';
import EngagementRadar from './charts/EngagementRadar';
import InsightPanel from './InsightPanel';
import ActivityTimeline from './ActivityTimeline';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

const Dashboard = () => {
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [courseId, setCourseId] = useState('http://example.com/course/1');
  const [activeTab, setActiveTab] = useState('overview');

  const {
    data,
    metrics,
    insights,
    chartData,
    loading,
    error,
    refresh,
    hasData,
    hasAnomalies,
    isStale
  } = useProcessedData(userEmail, courseId);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        refresh();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loading, refresh]);

  if (loading && !hasData) {
    return <LoadingSpinner />;
  }

  if (error && !hasData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-red-500/20 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white text-center mb-2">
            Connection Error
          </h2>
          <p className="text-slate-300 text-center mb-4">{error}</p>
          <button
            onClick={refresh}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: BookOpen,
      title: 'Modules Completed',
      value: metrics?.progress?.completed || 0,
      subtitle: of ,
      color: 'purple'
    },
    {
      icon: TrendingUp,
      title: 'Average Score',
      value: ${metrics?.scores?.average || 0}%,
      subtitle: metrics?.scores?.trend || 'stable',
      color: 'blue'
    },
    {
      icon: Award,
      title: 'Assessments',
      value: metrics?.scores?.scores?.length || 0,
      subtitle: ${metrics?.scores?.passRate || 0}% pass rate,
      color: 'green'
    },
    {
      icon: Clock,
      title: 'Study Time',
      value: metrics?.engagement?.totalVideoTimeFormatted || '0m',
      subtitle: ${metrics?.engagement?.studySessions || 0} sessions,
      color: 'orange'
    }
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="container mx-auto px-6 py-8">
          <DashboardHeader
            userEmail={userEmail}
            courseId={courseId}
            onUserEmailChange={setUserEmail}
            onCourseIdChange={setCourseId}
            onRefresh={refresh}
            isLoading={loading}
            isStale={isStale}
            hasAnomalies={hasAnomalies}
          />

          {/* Status Indicators */}
          {(isStale || hasAnomalies) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex gap-4"
            >
              {isStale && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-200 text-sm">Data is outdated</span>
                </div>
              )}
              {hasAnomalies && (
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-200 text-sm">Data anomalies detected</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-white/5 backdrop-blur-lg rounded-xl p-1 border border-white/10">
              {['overview', 'progress', 'performance', 'engagement'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={px-6 py-3 rounded-lg font-medium transition-all duration-200 capitalize \}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && (
                <OverviewTab
                  statCards={statCards}
                  insights={insights}
                  chartData={chartData}
                  metrics={metrics}
                />
              )}
              {activeTab === 'progress' && (
                <ProgressTab
                  progressData={metrics?.progress}
                  timelineData={metrics?.timeline}
                  chartData={chartData}
                />
              )}
              {activeTab === 'performance' && (
                <PerformanceTab
                  scoreData={metrics?.scores}
                  chartData={chartData}
                />
              )}
              {activeTab === 'engagement' && (
                <EngagementTab
                  engagementData={metrics?.engagement}
                  chartData={chartData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Tab Components
const OverviewTab = ({ statCards, insights, chartData, metrics }) => (
  <div className="space-y-8">
    {/* Stat Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <StatCard key={index} {...card} index={index} />
      ))}
    </div>

    {/* Main Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ProgressChart data={chartData?.progress} />
      <ScoreChart data={chartData?.scores} />
    </div>

    {/* Insights and Timeline */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <ActivityTimeline data={metrics?.timeline} />
      </div>
      <div>
        <InsightPanel insights={insights} />
      </div>
    </div>
  </div>
);

const ProgressTab = ({ progressData, timelineData, chartData }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ProgressChart data={chartData?.progress} detailed />
      <TimelineChart data={chartData?.timeline} />
    </div>
    <ActivityTimeline data={timelineData} detailed />
  </div>
);

const PerformanceTab = ({ scoreData, chartData }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ScoreChart data={chartData?.scores} detailed />
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold mb-4">Score Distribution</h3>
        {/* Distribution chart will go here */}
      </div>
    </div>
  </div>
);

const EngagementTab = ({ engagementData, chartData }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <EngagementRadar data={chartData?.engagement} />
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold mb-4">Study Patterns</h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-slate-300">Current Streak</span>
            <span className="text-purple-400 font-semibold">
              {engagementData?.currentStreak || 0} days
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Longest Streak</span>
            <span className="text-purple-400 font-semibold">
              {engagementData?.longestStreak || 0} days
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Study Sessions</span>
            <span className="text-purple-400 font-semibold">
              {engagementData?.studySessions || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
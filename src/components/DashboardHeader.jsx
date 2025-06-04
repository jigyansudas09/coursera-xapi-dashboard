import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  Settings, 
  User, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Database
} from 'lucide-react';

const DashboardHeader = ({
  userEmail,
  courseId,
  onUserEmailChange,
  onCourseIdChange,
  onRefresh,
  isLoading,
  isStale,
  hasAnomalies
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title and Status */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Learning Analytics Dashboard
            </h1>
            <div className="flex items-center gap-2">
              {isLoading && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="w-5 h-5 text-purple-400" />
                </motion.div>
              )}
              {!isLoading && !hasAnomalies && !isStale && (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
              {(hasAnomalies || isStale) && (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              )}
            </div>
          </div>
          <p className="text-slate-300">
            Track your Coursera progress with advanced insights and analytics
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30 rounded-lg transition-colors"
          >
            <RefreshCw className={w-4 h-4 \} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600/20 hover:bg-slate-600/30 border border-slate-500/30 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Dashboard Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                User Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => onUserEmailChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                  placeholder="Enter user email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Course ID
              </label>
              <div className="relative">
                <Database className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={courseId}
                  onChange={(e) => onCourseIdChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                  placeholder="Enter course ID"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Apply Settings
            </button>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
};

export default DashboardHeader;
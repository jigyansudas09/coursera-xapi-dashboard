import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const ProgressChart = ({ data, detailed = false }) => {
  if (!data) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4 w-1/3"></div>
          <div className="h-64 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.labels,
    datasets: [{
      data: data.datasets[0].data,
      backgroundColor: [
        'rgba(168, 85, 247, 0.8)',
        'rgba(71, 85, 105, 0.3)'
      ],
      borderColor: [
        'rgba(168, 85, 247, 1)',
        'rgba(71, 85, 105, 0.5)'
      ],
      borderWidth: 3,
      cutout: '75%',
      borderRadius: 8,
      borderJoinStyle: 'round'
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'white',
          font: { size: 12, family: 'Inter' },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return \: \ (\%);
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeInOutQuart'
    }
  };

  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: (chart) => {
      const { width, height, ctx } = chart;
      ctx.restore();
      
      const fontSize = (height / 114).toFixed(2);
      ctx.font = old \em Inter;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(168, 85, 247, 1)';
      
      const percentage = data.centerText?.percentage || 0;
      const text = \%;
      const textX = Math.round((width - ctx.measureText(text).width) / 2);
      const textY = height / 2 - 10;
      
      ctx.fillText(text, textX, textY);
      
      // Label
      ctx.font = \em Inter;
      ctx.fillStyle = 'rgba(148, 163, 184, 1)';
      const labelText = data.centerText?.label || 'Complete';
      const labelX = Math.round((width - ctx.measureText(labelText).width) / 2);
      const labelY = height / 2 + 20;
      
      ctx.fillText(labelText, labelX, labelY);
      ctx.save();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 group hover:border-purple-500/30 transition-colors duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Course Progress</h3>
        {detailed && (
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Live Data</span>
          </div>
        )}
      </div>
      
      <div className="relative h-64">
        <Doughnut 
          data={chartData} 
          options={options} 
          plugins={[centerTextPlugin]}
        />
      </div>

      {detailed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-2 gap-4"
        >
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">
              {data.datasets[0].data[0]}
            </div>
            <div className="text-sm text-slate-300">Completed</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-slate-400">
              {data.datasets[0].data[1]}
            </div>
            <div className="text-sm text-slate-300">Remaining</div>
          </div>
        </motion.div>
      )}

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
};

export default ProgressChart;
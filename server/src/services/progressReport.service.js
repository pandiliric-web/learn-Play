import Progress from '../models/Progress.js';
import mongoose from 'mongoose';

/**
 * Aggregate student progress data by subject
 */
export const aggregateStudentProgress = async (studentId, dateRange = null) => {
  try {
    const matchQuery = { studentId: new mongoose.Types.ObjectId(studentId) };
    
    // Add date range filter if provided
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      matchQuery.createdAt = {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      };
    }

    // Aggregate progress by subject
    const subjectStats = await Progress.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$subject',
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: '$quizScore' },
          highestScore: { $max: '$quizScore' },
          lowestScore: { $min: '$quizScore' },
          totalCorrectAnswers: { $sum: '$correctAnswers' },
          totalQuestions: { $sum: '$totalQuestions' },
          totalTimeSpent: { $sum: '$timeSpent' },
          quizzes: {
            $push: {
              score: '$quizScore',
              date: '$createdAt',
              difficulty: '$difficulty',
              gameType: '$gameType'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate overall statistics
    const allProgress = await Progress.find(matchQuery).lean();
    const overallStats = {
      totalQuizzes: allProgress.length,
      averageScore: allProgress.length > 0
        ? Math.round(allProgress.reduce((sum, p) => sum + p.quizScore, 0) / allProgress.length)
        : 0,
      highestScore: allProgress.length > 0
        ? Math.max(...allProgress.map(p => p.quizScore))
        : 0,
      totalTimeSpent: allProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0),
      totalCorrectAnswers: allProgress.reduce((sum, p) => sum + (p.correctAnswers || 0), 0),
      totalQuestions: allProgress.reduce((sum, p) => sum + (p.totalQuestions || 0), 0)
    };

    // Format subject statistics
    const subjects = ['Mathematics', 'English', 'Filipino'];
    const formattedSubjectStats = subjects.map(subject => {
      const stat = subjectStats.find(s => s._id === subject);
      if (stat) {
        return {
          subject: stat._id,
          totalQuizzes: stat.totalQuizzes,
          averageScore: Math.round(stat.averageScore),
          highestScore: stat.highestScore,
          lowestScore: stat.lowestScore,
          totalCorrectAnswers: stat.totalCorrectAnswers,
          totalQuestions: stat.totalQuestions,
          totalTimeSpent: stat.totalTimeSpent,
          accuracy: stat.totalQuestions > 0
            ? Math.round((stat.totalCorrectAnswers / stat.totalQuestions) * 100)
            : 0
        };
      }
      return {
        subject,
        totalQuizzes: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalCorrectAnswers: 0,
        totalQuestions: 0,
        totalTimeSpent: 0,
        accuracy: 0
      };
    });

    return {
      overall: overallStats,
      bySubject: formattedSubjectStats,
      dateRange: dateRange || null
    };
  } catch (error) {
    console.error('[ProgressReport] Error aggregating student progress:', error);
    throw error;
  }
};

/**
 * Generate chart image URL using QuickChart API
 */
export const generateChartImage = (chartType, data, options = {}) => {
  const baseUrl = 'https://quickchart.io/chart';
  
  let chartConfig = {};
  
  if (chartType === 'bar') {
    // Bar chart for subject performance
    chartConfig = {
      type: 'bar',
      data: {
        labels: data.labels || [],
        datasets: [{
          label: data.label || 'Average Score',
          data: data.values || [],
          backgroundColor: data.colors || [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 192, 0.8)'
          ],
          borderColor: data.borderColors || [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: options.title || 'Performance by Subject',
            font: { size: 18, weight: 'bold' }
          }
        },
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
  } else if (chartType === 'pie') {
    // Pie chart for quiz distribution
    chartConfig = {
      type: 'pie',
      data: {
        labels: data.labels || [],
        datasets: [{
          data: data.values || [],
          backgroundColor: data.colors || [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(153, 102, 255, 0.8)'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: options.title || 'Quiz Distribution',
            font: { size: 18, weight: 'bold' }
          }
        }
      }
    };
  } else if (chartType === 'line') {
    // Line chart for progress over time
    chartConfig = {
      type: 'line',
      data: {
        labels: data.labels || [],
        datasets: [{
          label: data.label || 'Score',
          data: data.values || [],
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          },
          title: {
            display: true,
            text: options.title || 'Progress Over Time',
            font: { size: 18, weight: 'bold' }
          }
        },
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

  // Encode chart config as URL parameter
  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  const width = options.width || 800;
  const height = options.height || 400;
  
  return `${baseUrl}?c=${encodedConfig}&width=${width}&height=${height}`;
};

/**
 * Generate all charts for progress report
 */
export const generateProgressCharts = (progressData) => {
  const charts = {};

  // 1. Bar chart: Average score by subject
  const subjectLabels = progressData.bySubject.map(s => s.subject);
  const subjectScores = progressData.bySubject.map(s => s.averageScore);
  const subjectColors = ['#FF6B6B', '#45B7D1', '#4ECDC4'];
  
  charts.subjectBarChart = generateChartImage('bar', {
    labels: subjectLabels,
    values: subjectScores,
    colors: subjectColors,
    borderColors: subjectColors,
    label: 'Average Score'
  }, {
    title: 'Average Score by Subject',
    width: 800,
    height: 400
  });

  // 2. Pie chart: Quiz distribution by subject
  const quizCounts = progressData.bySubject.map(s => s.totalQuizzes);
  charts.subjectPieChart = generateChartImage('pie', {
    labels: subjectLabels,
    values: quizCounts,
    colors: subjectColors
  }, {
    title: 'Quizzes Completed by Subject',
    width: 600,
    height: 400
  });

  // 3. Bar chart: Total quizzes by subject
  charts.quizCountChart = generateChartImage('bar', {
    labels: subjectLabels,
    values: quizCounts,
    colors: subjectColors.map(c => c + '80'), // Lighter colors
    borderColors: subjectColors,
    label: 'Total Quizzes'
  }, {
    title: 'Total Quizzes by Subject',
    width: 800,
    height: 400
  });

  return charts;
};



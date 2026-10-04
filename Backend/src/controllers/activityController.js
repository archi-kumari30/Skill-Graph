const DailyActivity = require('../models/DailyActivity');
const { catchAsync } = require('../utils/helpers');
const { BadRequestError } = require('../utils/customErrors');

// Calculate consecutive streak days ending today or yesterday
const calculateStreak = (activeDatesSet) => {
  let streak = 0;
  const d = new Date();
  
  // Format local date helper YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const todayStr = formatDate(d);
  d.setDate(d.getDate() - 1);
  const yesterdayStr = formatDate(d);

  // If today has activity, count from today; if not but yesterday has, count from yesterday; else 0
  let checkDate = new Date();
  if (!activeDatesSet.has(todayStr)) {
    if (activeDatesSet.has(yesterdayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      return 0;
    }
  }

  while (true) {
    const checkStr = formatDate(checkDate);
    if (activeDatesSet.has(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// Get activity summary and logs
const getActivitySummary = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  // Fetch last 60 days
  const activities = await DailyActivity.find({ userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const allActivities = await DailyActivity.find({ userId }).select('date minutesSpent activityType').lean();

  const activeDatesSet = new Set(allActivities.map(a => a.date));
  const streak = calculateStreak(activeDatesSet);

  // Calculate 7-day stats
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  let minutesThisWeek = 0;
  let totalMinutes = 0;
  const typeCounts = {};

  allActivities.forEach(a => {
    totalMinutes += (a.minutesSpent || 0);
    if (a.date >= sevenDaysAgoStr) {
      minutesThisWeek += (a.minutesSpent || 0);
    }
    typeCounts[a.activityType] = (typeCounts[a.activityType] || 0) + 1;
  });

  // Generate 7-day history for charts
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayActivities = allActivities.filter(a => a.date === dateStr);
    const dayMinutes = dayActivities.reduce((acc, curr) => acc + (curr.minutesSpent || 0), 0);
    last7Days.push({
      date: dateStr,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: dayMinutes,
      count: dayActivities.length
    });
  }

  res.status(200).json({
    success: true,
    data: {
      streak,
      minutesThisWeek,
      hoursThisWeek: parseFloat((minutesThisWeek / 60).toFixed(1)),
      totalHours: parseFloat((totalMinutes / 60).toFixed(1)),
      last7Days,
      typeCounts,
      recentActivities: activities.slice(0, 20)
    }
  });
});

// Log custom activity / practice
const logActivity = catchAsync(async (req, res, next) => {
  const { title, details, minutesSpent, activityType, date } = req.body;

  if (!title) {
    throw new BadRequestError('Activity title is required');
  }

  const today = new Date().toISOString().split('T')[0];
  const activityDate = date || today;

  const activity = await DailyActivity.create({
    userId: req.user._id,
    date: activityDate,
    activityType: activityType || 'practice_session',
    title,
    details: details || '',
    minutesSpent: minutesSpent ? parseInt(minutesSpent, 10) : 30
  });

  res.status(201).json({
    success: true,
    data: activity
  });
});

module.exports = {
  getActivitySummary,
  logActivity
};

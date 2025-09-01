const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

class AttendanceAutomationService {
  constructor() {
    this.isRunning = false;
  }

  // Start the automation service
  start() {
    if (this.isRunning) {
      console.log('Attendance automation service is already running');
      return;
    }

    console.log('Starting attendance automation service...');

    // Schedule daily attendance check at 11:59 PM (just before midnight)
    // This ensures we check for the current day's attendance
    cron.schedule('42 09 * * *', async () => {
      console.log('Running daily attendance check...');
      await this.checkAndMarkDailyAttendance();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata" // Adjust timezone as needed
    });

    // Schedule weekly attendance check every Sunday at 12:01 AM
    // This processes the previous week's attendance
    cron.schedule('1 0 * * 0', async () => {
      console.log('Running weekly attendance check...');
      await this.checkAndMarkWeeklyAttendance();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata" // Adjust timezone as needed
    });

    // Schedule monthly attendance check on the 1st of each month at 12:01 AM
    cron.schedule('1 0 1 * *', async () => {
      console.log('Running monthly attendance check...');
      await this.checkAndMarkMonthlyAttendance();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata" // Adjust timezone as needed
    });

    this.isRunning = true;
    console.log('Attendance automation service started successfully');
  }

  // Stop the automation service
  stop() {
    if (!this.isRunning) {
      console.log('Attendance automation service is not running');
      return;
    }

    cron.getTasks().forEach(task => {
      if (task.task.includes('attendance')) {
        task.stop();
      }
    });

    this.isRunning = false;
    console.log('Attendance automation service stopped');
  }

  // Check and mark daily attendance for all users
  async checkAndMarkDailyAttendance() {
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      console.log('Today:', today);
      
      // Skip if it's Sunday
      if (today.getDay() === 0) {
        console.log('Sunday detected - skipping daily attendance check');
        return;
      }

      console.log(`Checking attendance for ${today.toDateString()}`);

      // Get all active users
      const users = await User.find({ isActive: true });
      console.log(`Found ${users.length} active users`);

      let markedAbsent = 0;

      for (const user of users) {
        try {
          // Check if attendance is already marked for today
          const existingAttendance = await Attendance.findOne({
            user: user._id,
            date: {
              $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
            }
          });

          if (!existingAttendance) {
            // Mark as absent
            const absentRecord = new Attendance({
              user: user._id,
              date: today,
              status: 'absent',
              notes: 'Automatically marked absent - no attendance recorded for the day',
              markedBy: null, // System-generated
              isAutoMarked: true
            });

            await absentRecord.save();
            markedAbsent++;
            console.log(`Auto-marked absent for user: ${user.email} on ${today.toDateString()}`);
          }
        } catch (userError) {
          console.error(`Error processing user ${user.email}:`, userError.message);
        }
      }

      console.log(`Daily attendance check completed. Marked ${markedAbsent} users as absent.`);
    } catch (error) {
      console.error('Error in daily attendance check:', error.message);
    }
  }

  // Check and mark weekly attendance for all users
  async checkAndMarkWeeklyAttendance() {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7); // Go back 7 days

      console.log(`Checking weekly attendance from ${weekStart.toDateString()} to ${today.toDateString()}`);

      // Get all active users
      const users = await User.find({ isActive: true });
      console.log(`Found ${users.length} active users`);

      let totalMarkedAbsent = 0;

      for (const user of users) {
        try {
          const markedCount = await Attendance.autoMarkAbsent(
            user._id,
            weekStart,
            today,
            null // System-generated
          );
          totalMarkedAbsent += markedCount;
        } catch (userError) {
          console.error(`Error processing weekly attendance for user ${user.email}:`, userError.message);
        }
      }

      console.log(`Weekly attendance check completed. Total marked absent: ${totalMarkedAbsent}`);
    } catch (error) {
      console.error('Error in weekly attendance check:', error.message);
    }
  }

  // Check and mark monthly attendance for all users
  async checkAndMarkMonthlyAttendance() {
    try {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      console.log(`Checking monthly attendance from ${monthStart.toDateString()} to ${monthEnd.toDateString()}`);

      // Get all active users
      const users = await User.find({ isActive: true });
      console.log(`Found ${users.length} active users`);

      let totalMarkedAbsent = 0;

      for (const user of users) {
        try {
          const markedCount = await Attendance.autoMarkAbsent(
            user._id,
            monthStart,
            monthEnd,
            null // System-generated
          );
          totalMarkedAbsent += markedCount;
        } catch (userError) {
          console.error(`Error processing monthly attendance for user ${user.email}:`, userError.message);
        }
      }

      console.log(`Monthly attendance check completed. Total marked absent: ${totalMarkedAbsent}`);
    } catch (error) {
      console.error('Error in monthly attendance check:', error.message);
    }
  }

  // Manual trigger for testing or immediate execution
  async runManualCheck(type = 'daily') {
    console.log(`Running manual ${type} attendance check...`);
    
    switch (type) {
      case 'daily':
        await this.checkAndMarkDailyAttendance();
        break;
      case 'weekly':
        await this.checkAndMarkWeeklyAttendance();
        break;
      case 'monthly':
        await this.checkAndMarkMonthlyAttendance();
        break;
      default:
        console.log('Invalid check type. Use: daily, weekly, or monthly');
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedules: {
        daily: '59 23 * * * (11:59 PM daily)',
        weekly: '1 0 * * 0 (12:01 AM every Sunday)',
        monthly: '1 0 1 * * (12:01 AM 1st of every month)'
      }
    };
  }
}

// Create singleton instance
const attendanceAutomationService = new AttendanceAutomationService();

module.exports = attendanceAutomationService;

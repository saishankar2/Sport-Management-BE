const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { protect: requireAuth } = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// MARK ATTENDANCE (Admin only)
router.post('/mark', requireAdmin, [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Valid status is required'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId, date, status, notes } = req.body;
    const adminId = req.user.id;
    const attendanceDate = new Date(date);

    // Check if it's Sunday (week-off)
    // if (attendanceDate.getDay() === 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Cannot mark attendance on Sunday - it is a week-off day'
    //   });
    // }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if attendance already exists for this date and user
    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: attendanceDate
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.notes = notes || existingAttendance.notes;
      existingAttendance.markedBy = adminId;
      
      await existingAttendance.save();
      
      return res.json({
        success: true,
        message: 'Attendance updated successfully',
        data: existingAttendance
      });
    }

    // Create new attendance record
    const attendance = new Attendance({
      user: userId,
      date: attendanceDate,
      status,
      notes,
      markedBy: adminId
    });

    await attendance.save();

    // Populate user details
    await attendance.populate('user', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already exists for this user and date'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
});

// MARK MULTIPLE ATTENDANCE (Admin only)
router.post('/mark-multiple', requireAdmin, [
  body('attendanceData').isArray().withMessage('Attendance data must be an array'),
  body('attendanceData.*.userId').isMongoId().withMessage('Valid user ID is required'),
  body('attendanceData.*.date').isISO8601().withMessage('Valid date is required'),
  body('attendanceData.*.status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Valid status is required'),
  body('attendanceData.*.notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { attendanceData } = req.body;
    const adminId = req.user.id;
    const results = [];

    for (const record of attendanceData) {
      try {
        const { userId, date, status, notes } = record;
        const attendanceDate = new Date(date);

        // Check if it's Sunday (week-off)
        if (attendanceDate.getDay() === 0) {
          results.push({
            userId,
            success: false,
            message: 'Cannot mark attendance on Sunday - it is a week-off day'
          });
          continue;
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
          results.push({
            userId,
            success: false,
            message: 'User not found'
          });
          continue;
        }

        // Check if attendance already exists
        let attendance = await Attendance.findOne({
          user: userId,
          date: attendanceDate
        });

        if (attendance) {
          // Update existing
          attendance.status = status;
          attendance.notes = notes || attendance.notes;
          attendance.markedBy = adminId;
          await attendance.save();
        } else {
          // Create new
          attendance = new Attendance({
            user: userId,
            date: attendanceDate,
            status,
            notes,
            markedBy: adminId
          });
          await attendance.save();
        }

        results.push({
          userId,
          success: true,
          message: 'Attendance processed successfully',
          data: attendance
        });

      } catch (error) {
        results.push({
          userId: record.userId,
          success: false,
          message: 'Error processing attendance',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Bulk attendance processing completed',
      results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing bulk attendance',
      error: error.message
    });
  }
});

// GET ATTENDANCE STATISTICS (User can view their own, Admin can view any user's)
router.get('/stats/:userId?', async (req, res) => {
  try {
    let userId = req.params.userId;
    
    // If no userId provided, use the authenticated user's ID
    if (!userId) {
      userId = req.user.id;
    } else {
      // If userId provided, check if user is admin or viewing their own stats
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own attendance statistics.'
        });
      }
    }

    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const stats = await Attendance.getAttendanceStats(
      userId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance statistics',
      error: error.message
    });
  }
});

// GET WEEKLY ATTENDANCE
router.get('/weekly/:userId?', async (req, res) => {
  try {
    let userId = req.params.userId;
    
    if (!userId) {
      userId = req.user.id;
    } else {
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own attendance.'
        });
      }
    }

    const { weekStart } = req.query;
    const weekStartDate = weekStart ? new Date(weekStart) : new Date();
    
    // Set to start of week (Monday)
    const day = weekStartDate.getDay();
    const diff = weekStartDate.getDate() - day + (day === 0 ? -6 : 1);
    weekStartDate.setDate(diff);
    weekStartDate.setHours(0, 0, 0, 0);

    const weeklyAttendance = await Attendance.getWeeklyAttendance(userId, weekStartDate);

    res.json({
      success: true,
      data: {
        weekStart: weekStartDate,
        weekEnd: new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000),
        attendance: weeklyAttendance
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly attendance',
      error: error.message
    });
  }
});

// GET MONTHLY ATTENDANCE
router.get('/monthly/:userId?', async (req, res) => {
  try {
    let userId = req.params.userId;
    
    if (!userId) {
      userId = req.user.id;
    } else {
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own attendance.'
        });
      }
    }

    const { year, month } = req.query;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const targetYear = parseInt(year) || currentYear;
    const targetMonth = parseInt(month) || currentMonth;

    const monthlyAttendance = await Attendance.getMonthlyAttendance(userId, targetYear, targetMonth);

    res.json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
        attendance: monthlyAttendance
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly attendance',
      error: error.message
    });
  }
});

// GET YEARLY ATTENDANCE
router.get('/yearly/:userId?', async (req, res) => {
  try {
    let userId = req.params.userId;
    
    if (!userId) {
      userId = req.user.id;
    } else {
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own attendance.'
        });
      }
    }

    const { year } = req.query;
    const currentYear = new Date().getFullYear();
    const targetYear = parseInt(year) || currentYear;

    const yearlyAttendance = await Attendance.getYearlyAttendance(userId, targetYear);

    res.json({
      success: true,
      data: {
        year: targetYear,
        attendance: yearlyAttendance
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching yearly attendance',
      error: error.message
    });
  }
});

// GET ALL ATTENDANCE FOR A USER (Admin only)
router.get('/user/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, startDate, endDate } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let query = { user: userId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('user', 'firstName lastName email')
      .populate('markedBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      data: {
        attendance,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          limit
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user attendance',
      error: error.message
    });
  }
});

// UPDATE ATTENDANCE (Admin only)
router.put('/:attendanceId', requireAdmin, [
  body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Valid status is required'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { attendanceId } = req.params;
    const { status, notes } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    attendance.status = status;
    if (notes !== undefined) {
      attendance.notes = notes;
    }
    attendance.markedBy = req.user.id;

    await attendance.save();

    await attendance.populate('user', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating attendance',
      error: error.message
    });
  }
});

// DELETE ATTENDANCE (Admin only)
router.delete('/:attendanceId', requireAdmin, async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    await Attendance.findByIdAndDelete(attendanceId);

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance record',
      error: error.message
    });
  }
});

// ===== ORGANIZATION-WIDE ATTENDANCE ENDPOINTS (Admin Only) =====

// GET ALL USERS' WEEKLY ATTENDANCE (Admin only)
router.get('/overview/weekly', requireAdmin, async (req, res) => {
  try {
    const { weekStart } = req.query;
    const weekStartDate = weekStart ? new Date(weekStart) : new Date();
    
    // Set to start of week (Monday)
    const day = weekStartDate.getDay();
    const diff = weekStartDate.getDate() - day + (day === 0 ? -6 : 1);
    weekStartDate.setDate(diff);
    weekStartDate.setHours(0, 0, 0, 0);
    
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    // Get all users
    const users = await User.find({ isActive: true }).select('firstName lastName email role');
    
    // Get attendance for all users in the week
    const attendance = await Attendance.find({
      date: { $gte: weekStartDate, $lte: weekEndDate }
    }).populate('user', 'firstName lastName email role');

    // Group attendance by user
    const userAttendanceMap = new Map();
    
    // Initialize all users with empty attendance
    users.forEach(user => {
      userAttendanceMap.set(user._id.toString(), {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        attendance: [],
        summary: {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          totalDays: 0
        }
      });
    });

    // Populate attendance data
    attendance.forEach(record => {
      const userId = record.user._id.toString();
      if (userAttendanceMap.has(userId)) {
        const userData = userAttendanceMap.get(userId);
        userData.attendance.push({
          date: record.date,
          status: record.status,
          notes: record.notes
        });
        
        // Update summary
        userData.summary.totalDays++;
        userData.summary[record.status]++;
      }
    });

    // Convert to array and calculate percentages
    const result = Array.from(userAttendanceMap.values()).map(userData => ({
      ...userData,
      summary: {
        ...userData.summary,
        presentPercentage: userData.summary.totalDays > 0 
          ? Math.round((userData.summary.present / userData.summary.totalDays) * 100 * 100) / 100
          : 0,
        absentPercentage: userData.summary.totalDays > 0 
          ? Math.round((userData.summary.absent / userData.summary.totalDays) * 100 * 100) / 100
          : 0,
        latePercentage: userData.summary.totalDays > 0 
          ? Math.round((userData.summary.late / userData.summary.totalDays) * 100 * 100) / 100
          : 0,
        excusedPercentage: userData.summary.totalDays > 0 
          ? Math.round((userData.summary.excused / userData.summary.totalDays) * 100 * 100) / 100
          : 0
      }
    }));

    res.json({
      success: true,
      data: {
        weekStart: weekStartDate,
        weekEnd: weekEndDate,
        totalUsers: users.length,
        userAttendance: result
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly overview',
      error: error.message
    });
  }
});

// GET ALL USERS' MONTHLY ATTENDANCE (Admin only)
router.get('/overview/monthly', requireAdmin, async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const targetYear = parseInt(year) || currentYear;
    const targetMonth = parseInt(month) || currentMonth;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get all users
    const users = await User.find({ isActive: true }).select('firstName lastName email role');
    
    // Get attendance for all users in the month
    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('user', 'firstName lastName email role');

    // Group attendance by user
    const userAttendanceMap = new Map();
    
    // Initialize all users with empty attendance
    users.forEach(user => {
      userAttendanceMap.set(user._id.toString(), {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        attendance: [],
        summary: {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          totalDays: 0
        }
      });
    });

    // Populate attendance data
    attendance.forEach(record => {
      const userId = record.user._id.toString();
      if (userAttendanceMap.has(userId)) {
        const userData = userAttendanceMap.get(userId);
        userData.attendance.push({
          date: record.date,
          status: record.status,
          notes: record.notes
        });
        
        // Update summary
        userData.summary.totalDays++;
        userData.summary[record.status]++;
      }
    });

    // Convert to array and calculate percentages
    const result = Array.from(userAttendanceMap.values()).map(userData => ({
      ...userData,
      summary: {
        ...userData.summary,
        presentPercentage: userData.summary.totalDays > 0 
          ? Math.round((userData.summary.present / userData.summary.totalDays) * 100 * 100) / 100
          : 0,
        absentPercentage: userData.summary.totalDays > 0 
          ? Math.round((userData.summary.absent / userData.summary.totalDays) * 100 * 100) / 100
          : 0,
        latePercentage: userData.summary.totalDays > 0 
          ? Math.round((userData.summary.late / userData.summary.totalDays) * 100 * 100) / 100
          : 0,
        excusedPercentage: userData.summary.totalDays > 0 
          ? Math.round((userData.summary.excused / userData.summary.totalDays) * 100 * 100) / 100
          : 0
      }
    }));

    res.json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
        totalUsers: users.length,
        userAttendance: result
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly overview',
      error: error.message
    });
  }
});

// GET ALL USERS' YEARLY ATTENDANCE (Admin only)
router.get('/overview/yearly', requireAdmin, async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = new Date().getFullYear();
    const targetYear = parseInt(year) || currentYear;

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31);
    endDate.setHours(23, 59, 59, 999);

    // Get all users
    const users = await User.find({ isActive: true }).select('firstName lastName email role');
    
    // Get attendance for all users in the year
    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('user', 'firstName lastName email role');

    // Group attendance by user
    const userAttendanceMap = new Map();
    
    // Initialize all users with empty attendance
    users.forEach(user => {
      userAttendanceMap.set(user._id.toString(), {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        attendance: [],
        summary: {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          totalDays: 0
        }
      });
    });

    // Populate attendance data
    attendance.forEach(record => {
      const userId = record.user._id.toString();
      if (userAttendanceMap.has(userId)) {
        const userData = userAttendanceMap.get(userId);
        userData.attendance.push({
          date: record.date,
          status: record.status,
          notes: record.notes
        });
        
        // Update summary
        userData.summary.totalDays++;
        userData.summary[record.status]++;
      }
    });

    // Convert to array and calculate percentages
    const result = Array.from(userAttendanceMap.values()).map(userData => ({
      ...userData,
      summary: {
        ...userData.summary,
        presentPercentage: userData.summary.totalDays > 0 
          ? Math.round((userData.summary.present / userData.summary.totalDays) * 100 * 100) / 100
          : 0,
        absentPercentage: userData.summary.totalDays > 0 
          ? Math.round((userData.summary.absent / userData.summary.totalDays) * 100 * 100) / 100
          : 0,
        latePercentage: userData.summary.totalDays > 0 
          ? Math.round((userData.summary.late / userData.summary.totalDays) * 100 * 100) / 100
          : 0,
        excusedPercentage: userData.summary.totalDays > 0 
          ? Math.round((userData.summary.excused / userData.summary.totalDays) * 100 * 100) / 100
          : 0
      }
    }));

    res.json({
      success: true,
      data: {
        year: targetYear,
        totalUsers: users.length,
        userAttendance: result
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching yearly overview',
      error: error.message
    });
  }
});

// GET ORGANIZATION-WIDE ATTENDANCE STATISTICS (Admin only)
router.get('/overview/stats', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all users
    const users = await User.find({ isActive: true }).select('firstName lastName email role');
    
    // Get attendance for all users in the date range (excluding Sundays)
    const attendance = await Attendance.find({
      date: { $gte: start, $lte: end },
      // Exclude Sundays using $expr and $dayOfWeek
      $expr: { $ne: [{ $dayOfWeek: '$date' }, 1] }
    }).populate('user', 'firstName lastName email role');

    // Calculate working days count (excluding Sundays)
    const workingDaysCount = Attendance.getWorkingDaysCount(start, end);

    // Calculate overall statistics
    const overallStats = {
      totalUsers: users.length,
      totalWorkingDays: workingDaysCount,
      totalAttendanceRecords: attendance.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      totalDays: 0
    };

    // Group by user for individual stats
    const userStatsMap = new Map();
    
    // Initialize user stats
    users.forEach(user => {
      userStatsMap.set(user._id.toString(), {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        totalDays: 0,
        workingDays: workingDaysCount
      });
    });

    // Calculate stats
    attendance.forEach(record => {
      const userId = record.user._id.toString();
      
      // Update overall stats
      overallStats.totalDays++;
      overallStats[record.status]++;
      
      // Update user stats
      if (userStatsMap.has(userId)) {
        const userStats = userStatsMap.get(userId);
        userStats.totalDays++;
        userStats[record.status]++;
      }
    });


    // Calculate overall percentages
    const overallPercentages = {
      presentPercentage: overallStats.totalDays > 0 
        ? Math.round((overallStats.present / overallStats.totalDays) * 100 * 100) / 100
        : 0,
      absentPercentage: overallStats.totalDays > 0 
        ? Math.round((overallStats.absent / overallStats.totalDays) * 100 * 100) / 100
        : 0,
      latePercentage: overallStats.totalDays > 0 
        ? Math.round((overallStats.late / overallStats.totalDays) * 100 * 100) / 100
        : 0,
      excusedPercentage: overallStats.totalDays > 0 
        ? Math.round((overallStats.excused / overallStats.totalDays) * 100 * 100) / 100
        : 0
    };

  

    // Calculate user percentages
    const userStats = Array.from(userStatsMap.values()).map(userData => ({
      ...userData,
      presentPercentage: userData.totalDays > 0 
        ? Math.round((userData.present / userData.totalDays) * 100 * 100) / 100
        : 0,
      absentPercentage: userData.totalDays > 0 
        ? Math.round((userData.absent / userData.totalDays) * 100 * 100) / 100
        : 0,
      latePercentage: userData.totalDays > 0 
        ? Math.round((userData.late / userData.totalDays) * 100 * 100) / 100
        : 0,
      excusedPercentage: userData.totalDays > 0 
        ? Math.round((userData.excused / userData.totalDays) * 100 * 100) / 100
        : 0
    }));

    res.json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end
        },
        workingDaysInfo: {
          totalWorkingDays: workingDaysCount,
          sundaysExcluded: true,
          note: 'Statistics calculated excluding Sundays (week-off days)'
        },
        overallStats: {
          ...overallStats,
          ...overallPercentages
        },
        userStats: userStats
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching organization statistics',
      error: error.message
    });
  }
});

// GET WORKING DAYS INFORMATION
router.get('/working-days', async (req, res) => {
  try {
    const { startDate, endDate, year, month } = req.query;
    
    if (startDate && endDate) {
      // Get working days for date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const workingDays = Attendance.getWorkingDaysCount(start, end);
      
      res.json({
        success: true,
        data: {
          period: { startDate: start, endDate: end },
          workingDays,
          sundaysExcluded: true,
          note: 'Working days exclude Sundays (week-off)'
        }
      });
    } else if (year && month) {
      // Get working days for specific month
      const workingDays = Attendance.getWorkingDaysInMonth(parseInt(year), parseInt(month));
      
      res.json({
        success: true,
        data: {
          year: parseInt(year),
          month: parseInt(month),
          workingDays: workingDays.length,
          workingDates: workingDays.map(date => date.toISOString().split('T')[0]),
          sundaysExcluded: true,
          note: 'Working days exclude Sundays (week-off)'
        }
      });
    } else if (year) {
      // Get working days for specific year
      const workingDays = Attendance.getWorkingDaysInYear(parseInt(year));
      
      res.json({
        success: true,
        data: {
          year: parseInt(year),
          workingDays: workingDays.length,
          sundaysExcluded: true,
          note: 'Working days exclude Sundays (week-off)'
        }
      });
    } else {
      // Get current week working days
      const today = new Date();
      const workingDays = Attendance.getWorkingDaysInWeek(today);
      
      res.json({
        success: true,
        data: {
          currentWeek: true,
          workingDays: workingDays.length,
          workingDates: workingDays.map(date => date.toISOString().split('T')[0]),
          sundaysExcluded: true,
          note: 'Working days exclude Sundays (week-off)'
        }
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching working days information',
      error: error.message
    });
  }
});

// GET AUTOMATION SERVICE STATUS (Admin only)
router.get('/automation/status', requireAdmin, async (req, res) => {
  try {
    const attendanceAutomationService = require('../services/attendanceAutomation');
    const status = attendanceAutomationService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching automation service status',
      error: error.message
    });
  }
});

// MANUAL TRIGGER AUTOMATION (Admin only) - for testing purposes
router.post('/automation/trigger', requireAdmin, [
  body('type').isIn(['daily', 'weekly', 'monthly']).withMessage('Valid type is required: daily, weekly, or monthly')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { type } = req.body;
    const attendanceAutomationService = require('../services/attendanceAutomation');
    
    // Run the manual check
    await attendanceAutomationService.runManualCheck(type);
    
    res.json({
      success: true,
      message: `Manual ${type} attendance check triggered successfully`,
      data: {
        type,
        timestamp: new Date().toISOString(),
        note: 'Check server logs for detailed results'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error triggering automation',
      error: error.message
    });
  }
});

module.exports = router;

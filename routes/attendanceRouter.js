const express = require('express');
const { body } = require('express-validator');
const {
  markAttendance,
  markMultipleAttendance,
  getAttendanceStats,
  getWeeklyAttendance,
  getMonthlyAttendance,
  getYearlyAttendance,
  getAllAttendanceForUser,
  updateAttendance,
  deleteAttendance,
  getWeeklyOverview,
  getMonthlyOverview,
  getYearlyOverview,
  getOrganizationStats,
  getWorkingDays,
  getAutomationStatus,
  triggerAutomation,
} = require('../controllers/attendanceController');
const { protect: requireAuth } = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// MARK ATTENDANCE (Admin only)
router.post(
  '/mark',
  requireAdmin,
  [
    body('userId').isMongoId().withMessage('Valid user ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('status')
      .isIn(['present', 'absent', 'late', 'excused'])
      .withMessage('Valid status is required'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
  ],
  markAttendance
);

// MARK MULTIPLE ATTENDANCE (Admin only)
router.post(
  '/mark-multiple',
  requireAdmin,
  [
    body('attendanceData')
      .isArray()
      .withMessage('Attendance data must be an array'),
    body('attendanceData.*.userId')
      .isMongoId()
      .withMessage('Valid user ID is required'),
    body('attendanceData.*.date')
      .isISO8601()
      .withMessage('Valid date is required'),
    body('attendanceData.*.status')
      .isIn(['present', 'absent', 'late', 'excused'])
      .withMessage('Valid status is required'),
    body('attendanceData.*.notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
  ],
  markMultipleAttendance
);

// GET ATTENDANCE STATISTICS (User can view their own, Admin can view any user's)
router.get('/stats/:userId?', getAttendanceStats);

// GET WEEKLY ATTENDANCE
router.get('/weekly/:userId?', getWeeklyAttendance);

// GET MONTHLY ATTENDANCE
router.get('/monthly/:userId?', getMonthlyAttendance);

// GET YEARLY ATTENDANCE
router.get('/yearly/:userId?', getYearlyAttendance);

// GET ALL ATTENDANCE FOR A USER (Admin only)
router.get('/user/:userId', requireAdmin, getAllAttendanceForUser);

// UPDATE ATTENDANCE (Admin only)
router.put(
  '/:attendanceId',
  requireAdmin,
  [
    body('status')
      .isIn(['present', 'absent', 'late', 'excused'])
      .withMessage('Valid status is required'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
  ],
  updateAttendance
);

// DELETE ATTENDANCE (Admin only)
router.delete('/:attendanceId', requireAdmin, deleteAttendance);

// ===== ORGANIZATION-WIDE ATTENDANCE ENDPOINTS (Admin Only) =====

// GET ALL USERS' WEEKLY ATTENDANCE (Admin only)
router.get('/overview/weekly', requireAdmin, getWeeklyOverview);

// GET ALL USERS' MONTHLY ATTENDANCE (Admin only)
router.get('/overview/monthly', requireAdmin, getMonthlyOverview);

// GET ALL USERS' YEARLY ATTENDANCE (Admin only)
router.get('/overview/yearly', requireAdmin, getYearlyOverview);

// GET ORGANIZATION-WIDE ATTENDANCE STATISTICS (Admin only)
router.get('/overview/stats', requireAdmin, getOrganizationStats);

// GET WORKING DAYS INFORMATION
router.get('/working-days', getWorkingDays);

// GET AUTOMATION SERVICE STATUS (Admin only)
router.get('/automation/status', requireAdmin, getAutomationStatus);

// MANUAL TRIGGER AUTOMATION (Admin only) - for testing purposes
router.post(
  '/automation/trigger',
  requireAdmin,
  [
    body('type')
      .isIn(['daily', 'weekly', 'monthly'])
      .withMessage('Valid type is required: daily, weekly, or monthly'),
  ],
  triggerAutomation
);

module.exports = router;

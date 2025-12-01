const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'absent'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be null for system-generated records
  },
  isAutoMarked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure one attendance record per user per date
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Static method to get attendance statistics
attendanceSchema.statics.getAttendanceStats = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        excused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        totalDays: 1,
        present: 1,
        absent: 1,
        late: 1,
        excused: 1,
        presentPercentage: {
          $round: [
            { $multiply: [{ $divide: ['$present', '$totalDays'] }, 100] },
            2
          ]
        },
        absentPercentage: {
          $round: [
            { $multiply: [{ $divide: ['$absent', '$totalDays'] }, 100] },
            2
          ]
        },
        latePercentage: {
          $round: [
            { $multiply: [{ $divide: ['$late', '$totalDays'] }, 100] },
            2
          ]
        },
        excusedPercentage: {
          $round: [
            { $multiply: [{ $divide: ['$excused', '$totalDays'] }, 100] },
            2
          ]
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    presentPercentage: 0,
    absentPercentage: 0,
    latePercentage: 0,
    excusedPercentage: 0
  };
};

// Static method to get weekly attendance (excluding Sundays)
attendanceSchema.statics.getWeeklyAttendance = async function(userId, weekStartDate) {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  
  return await this.find({
    user: userId,
    date: { $gte: weekStartDate, $lte: weekEndDate },
    // Exclude Sundays using $expr and $dayOfWeek
    $expr: { $ne: [{ $dayOfWeek: '$date' }, 1] }
  }).sort({ date: 1 });
};

// Static method to get monthly attendance (excluding Sundays)
attendanceSchema.statics.getMonthlyAttendance = async function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return await this.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate },
    // Exclude Sundays using $expr and $dayOfWeek
    $expr: { $ne: [{ $dayOfWeek: '$date' }, 1] }
  }).sort({ date: 1 });
};

// Static method to get yearly attendance (excluding Sundays)
attendanceSchema.statics.getYearlyAttendance = async function(userId, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  return await this.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate },
    // Exclude Sundays using $expr and $dayOfWeek
    $expr: { $ne: [{ $dayOfWeek: '$date' }, 1] }
  }).sort({ date: 1 });
};

// Instance method to get attendance status for a specific date
attendanceSchema.methods.getStatus = function() {
  return this.status;
};

// Static method to get working days count between two dates (excluding Sundays)
attendanceSchema.statics.getWorkingDaysCount = function(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    // Skip Sundays (day 0 = Sunday)
    if (current.getDay() !== 0) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

// Static method to get working days in a week (Monday to Saturday)
attendanceSchema.statics.getWorkingDaysInWeek = function(weekStartDate) {
  const workingDays = [];
  const current = new Date(weekStartDate);
  
  // Ensure we start from Monday (day 1)
  while (current.getDay() !== 1) {
    current.setDate(current.getDate() + 1);
  }
  
  // Add 6 working days (Monday to Saturday)
  for (let i = 0; i < 6; i++) {
    workingDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
};

// Static method to get working days in a month (excluding Sundays)
attendanceSchema.statics.getWorkingDaysInMonth = function(year, month) {
  const workingDays = [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const current = new Date(startDate);
  
  while (current <= endDate) {
    // Skip Sundays (day 0 = Sunday)
    if (current.getDay() !== 0) {
      workingDays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
};

// Static method to get working days in a year (excluding Sundays)
attendanceSchema.statics.getWorkingDaysInYear = function(year) {
  const workingDays = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  const current = new Date(startDate);
  
  while (current <= endDate) {
    // Skip Sundays (day 0 = Sunday)
    if (current.getDay() !== 0) {
      workingDays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
};

// Static method to automatically mark absent for missing working days
attendanceSchema.statics.autoMarkAbsent = async function(userId, startDate, endDate, adminId) {
  const workingDays = this.getWorkingDaysCount(startDate, endDate);
  const existingAttendance = await this.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  });
  
  const existingDates = existingAttendance.map(att => 
    att.date.toDateString()
  );
  
  const missingDates = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    // Skip Sundays
    if (current.getDay() !== 0) {
      const dateString = current.toDateString();
      if (!existingDates.includes(dateString)) {
        missingDates.push(new Date(current));
      }
    }
    current.setDate(current.getDate() + 1);
  }
  
  // Create absent records for missing working days
  const absentRecords = [];
  for (const date of missingDates) {
    const absentRecord = new this({
      user: userId,
      date: date,
      status: 'absent',
      notes: 'Automatically marked absent - no attendance recorded',
      markedBy: adminId
    });
    absentRecords.push(absentRecord);
  }
  
  if (absentRecords.length > 0) {
    await this.insertMany(absentRecords);
  }
  
  return absentRecords.length;
};

module.exports = mongoose.model('Attendance', attendanceSchema);

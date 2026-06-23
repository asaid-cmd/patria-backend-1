const mongoose = require('mongoose');

const driverShiftSchema = new mongoose.Schema(
  {
    driverId:              { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    startedAt:             { type: Date, required: true },
    endedAt:               { type: Date, default: null },
    scheduledEndAt:        { type: Date, default: null },
    hoursWorked:           { type: Number, default: 0 },
    ordersCompleted:       { type: Number, default: 0 },
    hourlyRate:            { type: Number, default: 0 },
    totalSalary:           { type: Number, default: 0 },
    status:                { type: String, enum: ['active', 'completed'], default: 'active' },
    overtimeRequested:     { type: Boolean, default: false },
    overtimeApproved:      { type: Boolean, default: false },
    overtimeExtendedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

driverShiftSchema.index({ driverId: 1, startedAt: -1 });
driverShiftSchema.index({ status: 1, startedAt: -1 });

module.exports = mongoose.model('DriverShift', driverShiftSchema);

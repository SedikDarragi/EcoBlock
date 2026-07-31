import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityType: {
    type: String,
    enum: ['product_scan', 'energy_trade', 'recycle'],
    required: true
  },
  details: {
    type: Object,
    required: true
  }
}, { timestamps: true });

export const UserActivity = mongoose.model('UserActivity', userActivitySchema);
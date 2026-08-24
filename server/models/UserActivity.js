import { userActivities } from '../db.js';

class UserActivity {
  constructor(data) {
    this.userId = data.userId;
    this.activityType = data.activityType;
    this.details = data.details;
    this.createdAt = new Date();
  }

  async save() {
    return userActivities.insert(this);
  }

  static async find(query) {
    return userActivities.find(query).sort({ createdAt: -1 });
  }

  static async findOne(query) {
    return userActivities.findOne(query);
  }
}

export { UserActivity };

import bcrypt from 'bcryptjs';
import { users } from '../db.js';

const User = {
  async create({ email, password, walletAddress }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const doc = await users.insert({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      walletAddress: walletAddress || '',
      ecoPoints: 0,
      createdAt: new Date()
    });
    return doc;
  },

  async findOne(query) {
    return users.findOne(query);
  },

  async findById(id) {
    return users.findOne({ _id: id });
  },

  async findByIdAndUpdate(id, update, options) {
    const set = {};
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        const doc = await users.findOne({ _id: id });
        set[k] = (doc?.[k] || 0) + v;
      }
    } else {
      Object.assign(set, update);
    }
    await users.update({ _id: id }, { $set: set });
    if (options?.new) return users.findOne({ _id: id });
    return null;
  },

  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
};

export default User;

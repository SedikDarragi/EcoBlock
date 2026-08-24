import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { JWT_SECRET } from '../config/jwt.js';

export const register = async (req, res) => {
  try {
    const { email, password, walletAddress } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ email, password, walletAddress });

    const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, email: user.email, walletAddress: user.walletAddress, ecoPoints: user.ecoPoints }
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, email: user.email, walletAddress: user.walletAddress, ecoPoints: user.ecoPoints }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error('GetUser error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const linkWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ message: 'Invalid Ethereum address' });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { walletAddress }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error('LinkWallet error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const validateToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...safeUser } = user;
    res.json({ valid: true, user: safeUser });
  } catch (err) {
    console.error('ValidateToken error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'ecoblock-demo-secret-change-in-prod';

class JsonStore {
  constructor(name) {
    this.filePath = path.join(__dirname, 'server', `${name}.json`);
    this.data = [];
    try {
      if (fs.existsSync(this.filePath)) {
        this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch { this.data = []; }
  }
  _save() {
    try { fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2)); } catch {}
  }
  _id() { return crypto.randomBytes(12).toString('hex'); }
  _match(doc, q) {
    for (const [k, v] of Object.entries(q)) {
      if (doc[k] !== v) return false;
    }
    return true;
  }
  async insert(doc) { const d = { ...doc, _id: doc._id || this._id() }; this.data.push(d); this._save(); return d; }
  async findOne(q) { return this.data.find(d => this._match(d, q)) || null; }
  async find(q) { return this.data.filter(d => this._match(d, q)); }
  async count(q) { return (!q || !Object.keys(q).length) ? this.data.length : this.data.filter(d => this._match(d, q)).length; }
  async update(q, u) {
    let c = 0;
    for (const d of this.data) {
      if (this._match(d, q)) {
        if (u.$set) Object.assign(d, u.$set);
        if (u.$inc) for (const [k, v] of Object.entries(u.$inc)) d[k] = (d[k] || 0) + v;
        c++;
      }
    }
    if (c) this._save();
    return c;
  }
}

const users = new JsonStore('users');
const activities = new JsonStore('activities');
const products = new JsonStore('products');

const pCount = await products.count({});
if (pCount === 0) {
  await products.insert({ _id: 'demo-product-123', name: 'Organic Cotton T-Shirt', brand: 'EcoWear', points: 30, barcode: '123456789012', imageUrl: 'assets/images/tshirt.jpg' });
  await products.insert({ _id: 'eco-bottle-456', name: 'Reusable Water Bottle', brand: 'HydroFlask', points: 50, barcode: '987654321098', imageUrl: 'assets/images/bottle.jpg' });
}

const app = express();
app.use(cors({ origin: function(o, cb) {
  const ok = !o || /netlify\.app$/i.test(o) || ['http://localhost:8100','http://localhost:4200','http://localhost:3000'].includes(o);
  cb(null, ok);
}, credentials: true }));
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ status: 'UP' }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, walletAddress } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const existing = await users.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ message: 'User already exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await users.insert({ email: email.toLowerCase().trim(), password: hash, walletAddress: walletAddress || '', ecoPoints: 0, createdAt: new Date().toISOString() });
    const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, walletAddress: user.walletAddress, ecoPoints: user.ecoPoints } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await users.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, walletAddress: user.walletAddress, ecoPoints: user.ecoPoints } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await users.findOne({ _id: decoded.user.id });
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  } catch { res.status(401).json({ error: 'Please authenticate' }); }
};

app.get('/api/auth/user', auth, async (req, res) => {
  const { password, ...safe } = req.user;
  res.json(safe);
});

app.post('/api/auth/link-wallet', auth, async (req, res) => {
  const { walletAddress } = req.body;
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) return res.status(400).json({ message: 'Invalid address' });
  await users.update({ _id: req.user._id }, { $set: { walletAddress } });
  const user = await users.findOne({ _id: req.user._id });
  const { password, ...safe } = user;
  res.json(safe);
});

app.get('/api/auth/validate-token', auth, (req, res) => {
  const { password, ...safe } = req.user;
  res.json({ valid: true, user: safe });
});

app.get('/api/activity/scan-history', auth, async (req, res) => {
  const history = (await activities.find({ userId: req.user._id, activityType: 'product_scan' })).slice(0, 20);
  res.json(history.map(i => ({ id: i._id, productId: i.details?.productId, name: i.details?.name, brand: i.details?.brand, points: i.details?.points, date: i.details?.scannedAt, image: i.details?.imageUrl })));
});

app.post('/api/activity/recycle', auth, async (req, res) => {
  try {
    const { material, weight } = req.body;
    const rates = { plastic: 20, glass: 18, paper: 10, metal: 25 };
    if (!material || !weight || !rates[material]) return res.status(400).json({ success: false, message: 'Invalid input' });
    const pointsEarned = Math.round(rates[material] * Number(weight));
    await activities.insert({ userId: req.user._id, activityType: 'recycle', details: { material, weight: Number(weight), pointsEarned } });
    await users.update({ _id: req.user._id }, { $inc: { ecoPoints: pointsEarned } });
    res.status(201).json({ success: true, message: 'Recycling recorded', pointsEarned });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.post('/api/products/validate', auth, async (req, res) => {
  try {
    const { id, productId, barcode } = req.body;
    const actualProduct = productId || id;
    if (!actualProduct && !barcode) return res.status(400).json({ valid: false, message: 'Product ID or barcode required' });
    const query = barcode ? { barcode } : { _id: actualProduct };
    const product = await products.findOne(query);
    if (!product) return res.status(404).json({ valid: false, message: 'Product not found' });
    const already = await activities.findOne({ userId: req.user._id, activityType: 'product_scan', 'details.productId': product._id });
    if (already) return res.status(400).json({ valid: false, message: 'Already scanned' });
    await activities.insert({ userId: req.user._id, activityType: 'product_scan', details: { productId: product._id, name: product.name, brand: product.brand, points: product.points, barcode: product.barcode, imageUrl: product.imageUrl, scannedAt: new Date().toISOString() } });
    await users.update({ _id: req.user._id }, { $inc: { ecoPoints: product.points } });
    res.json({ valid: true, message: 'Product validated', ecoPoints: product.points, scanRecord: { productId: product._id, name: product.name, brand: product.brand, points: product.points } });
  } catch (err) { res.status(500).json({ valid: false, message: 'Server error' }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

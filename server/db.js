import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class JsonStore {
  constructor(name) {
    this.filePath = path.join(__dirname, `${name}.json`);
    this.data = [];
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch {
      this.data = [];
    }
  }

  _save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error(`Failed to save ${this.filePath}:`, err.message);
    }
  }

  _generateId() {
    return crypto.randomBytes(12).toString('hex');
  }

  async insert(doc) {
    const newDoc = { ...doc, _id: doc._id || this._generateId() };
    this.data.push(newDoc);
    this._save();
    return newDoc;
  }

  async findOne(query) {
    return this.data.find(doc => this._match(doc, query)) || null;
  }

  async find(query) {
    return this.data.filter(doc => this._match(doc, query));
  }

  async update(query, update) {
    let count = 0;
    for (const doc of this.data) {
      if (this._match(doc, query)) {
        if (update.$set) Object.assign(doc, update.$set);
        if (update.$inc) {
          for (const [k, v] of Object.entries(update.$inc)) {
            doc[k] = (doc[k] || 0) + v;
          }
        }
        count++;
      }
    }
    if (count > 0) this._save();
    return count;
  }

  async count(query) {
    if (!query || Object.keys(query).length === 0) return this.data.length;
    return this.data.filter(doc => this._match(doc, query)).length;
  }

  _match(doc, query) {
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (value.$gt !== undefined && !(doc[key] > value.$gt)) return false;
        if (value.$lt !== undefined && !(doc[key] < value.$lt)) return false;
      } else {
        if (doc[key] !== value) return false;
      }
    }
    return true;
  }
}

const users = new JsonStore('users');
const userActivities = new JsonStore('activities');
const products = new JsonStore('products');

async function seed() {
  try {
    const count = await products.count({});
    if (count === 0) {
      await products.insert({ _id: 'demo-product-123', name: 'Organic Cotton T-Shirt', brand: 'EcoWear', points: 30, barcode: '123456789012', imageUrl: 'assets/images/tshirt.jpg' });
      await products.insert({ _id: 'eco-bottle-456', name: 'Reusable Water Bottle', brand: 'HydroFlask', points: 50, barcode: '987654321098', imageUrl: 'assets/images/bottle.jpg' });
      console.log('Seeded demo products');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

seed();

export { users, userActivities, products };

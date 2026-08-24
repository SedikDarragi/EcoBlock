import Datastore from 'nedb-promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname);

const users = new Datastore({ filename: path.join(dbDir, 'users.db'), autoload: true });
const userActivities = new Datastore({ filename: path.join(dbDir, 'activities.db'), autoload: true });
const products = new Datastore({ filename: path.join(dbDir, 'products.db'), autoload: true });

users.ensureIndex({ fieldName: 'email', unique: true });

const seedProducts = [
  { _id: 'demo-product-123', name: 'Organic Cotton T-Shirt', brand: 'EcoWear', points: 30, barcode: '123456789012', imageUrl: 'assets/images/tshirt.jpg' },
  { _id: 'eco-bottle-456', name: 'Reusable Water Bottle', brand: 'HydroFlask', points: 50, barcode: '987654321098', imageUrl: 'assets/images/bottle.jpg' }
];

const count = await products.count({});
if (count === 0) {
  for (const p of seedProducts) {
    await products.insert(p);
  }
  console.log('Seeded demo products');
}

export { users, userActivities, products };

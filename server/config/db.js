import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Product from '../models/Product.js';

let mongod;

const seedProducts = [
  {
    _id: 'demo-product-123',
    name: 'Organic Cotton T-Shirt',
    brand: 'EcoWear',
    points: 30,
    barcode: '123456789012',
    imageUrl: 'assets/images/tshirt.jpg'
  },
  {
    _id: 'eco-bottle-456',
    name: 'Reusable Water Bottle',
    brand: 'HydroFlask',
    points: 50,
    barcode: '987654321098',
    imageUrl: 'assets/images/bottle.jpg'
  }
];

const seedProductsIfEmpty = async () => {
  try {
    const count = await Product.estimatedDocumentCount();
    if (count === 0) {
      await Product.insertMany(seedProducts);
      console.log('Seeded demo products...');
    }
  } catch (err) {
    console.error('Product seeding error:', err);
  }
};

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) return;

    let uri = process.env.MONGO_URI;

    if (!uri) {
      // No MONGO_URI provided: run with an in-memory MongoDB (demo mode).
      // Data resets when the process restarts.
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri('ecoblock');
      console.log('Using in-memory demo database (no MONGO_URI set)');
    }

    await mongoose.connect(uri);
    console.log('MongoDB Connected...');
    await seedProductsIfEmpty();
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};

export default connectDB;

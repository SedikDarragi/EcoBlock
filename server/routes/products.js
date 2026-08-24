import express from 'express';
import Product from '../models/Product.js';
import { UserActivity } from '../models/UserActivity.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Validate product scan
router.post('/validate', auth, async (req, res) => {
  try {
    const { id, productId, barcode } = req.body;

    // Accept either productId/id or barcode to find the product
    const actualProduct = productId || id;

    if (!actualProduct && !barcode) {
      return res.status(400).json({
        valid: false,
        message: 'Product ID or barcode is required'
      });
    }

    const query = barcode ? { barcode } : { _id: actualProduct };
    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({
        valid: false,
        message: 'Product not found or barcode does not match'
      });
    }

    // Dedupe scans: reject if the user already scanned this product
    const alreadyScanned = await UserActivity.findOne({
      userId: req.user._id,
      activityType: 'product_scan',
      'details.productId': product._id
    });

    if (alreadyScanned) {
      return res.status(400).json({
        valid: false,
        message: 'This product has already been scanned by you'
      });
    }

    // Record the scan using values from the DB (never trust the client)
    const activity = new UserActivity({
      userId: req.user._id,
      activityType: 'product_scan',
      details: {
        productId: product._id,
        name: product.name,
        brand: product.brand,
        points: product.points,
        barcode: product.barcode || null,
        imageUrl: product.imageUrl || null,
        scannedAt: new Date()
      }
    });

    await activity.save();

    // Credit eco-points to the user
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { ecoPoints: product.points } }
    );

    res.json({
      valid: true,
      message: 'Product validated successfully',
      ecoPoints: product.points,
      scanRecord: {
        id: activity._id,
        productId: product._id,
        name: product.name,
        brand: product.brand,
        points: product.points,
        barcode: product.barcode || null,
        date: activity.details.scannedAt,
        image: product.imageUrl
      }
    });

  } catch (error) {
    console.error('Product validation error:', error);
    res.status(500).json({
      valid: false,
      message: 'Server error during validation'
    });
  }
});

export default router;
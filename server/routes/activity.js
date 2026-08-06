import express from 'express';
import { UserActivity } from '../models/UserActivity.js';
import User from '../models/User.js';
import { requireModule } from '../utils/importer.js';
const { auth } = await requireModule('../middleware/auth.js', import.meta.url);

const router = express.Router();

const RECYCLE_RATES = {
  plastic: 20,
  glass: 18,
  paper: 10,
  metal: 25
};

// POST /api/activity/recycle
router.post('/recycle', auth, async (req, res) => {
  try {
    const { material, weight } = req.body;

    if (!material || !weight || isNaN(weight) || Number(weight) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid material and positive weight are required'
      });
    }

    if (!Object.prototype.hasOwnProperty.call(RECYCLE_RATES, material)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported material type'
      });
    }

    // Compute points server-side; never trust client-supplied values
    const pointsEarned = Math.round(RECYCLE_RATES[material] * Number(weight));

    const activity = new UserActivity({
      userId: req.user._id,
      activityType: 'recycle',
      details: { material, weight: Number(weight), pointsEarned }
    });

    await activity.save();

    // Credit eco-points to the user
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { ecoPoints: pointsEarned } }
    );

    res.status(201).json({
      success: true,
      message: 'Recycling recorded successfully',
      pointsEarned,
      data: activity
    });

  } catch (error) {
    console.error('Recycle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/scan-history', auth, async (req, res) => {
  try {
    const history = await UserActivity.find({
      userId: req.user._id,
      activityType: 'product_scan'
    })
    .sort({ 'details.scannedAt': -1 })
    .limit(20);

    res.json(history.map(item => ({
      id: item._id,
      productId: item.details.productId,
      name: item.details.name,
      brand: item.details.brand,
      points: item.details.points,
      date: item.details.scannedAt,
      image: item.details.imageUrl
    })));

  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to load scan history' });
  }
});

export default router;
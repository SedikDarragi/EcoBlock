import express from 'express';
import { register, login, getUser, linkWallet, validateToken } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user', auth, getUser);
router.post('/link-wallet', auth, linkWallet);
router.get('/validate-token', auth, validateToken);

// Export as default
export default router;
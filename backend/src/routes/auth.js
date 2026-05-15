const express = require('express');
const { body } = require('express-validator');
const { register, login, googleLogin, getMe, refresh, logout, logoutAll, updateUsername, completeTour } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { geoBlock } = require('../middleware/geoBlock');

const router = express.Router();

router.post('/register', geoBlock, [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], register);

router.post('/signup', geoBlock, [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], register);

router.post('/login', geoBlock, [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
], login);

router.post('/google', geoBlock, [
    body('credential').notEmpty().withMessage('Credential is required')
], googleLogin);

router.get('/me', auth, getMe);

router.post('/refresh', refresh);

router.post('/logout', logout);
router.post('/logout-all', auth, logoutAll);
router.patch('/username', auth, updateUsername);
router.patch('/tour-complete', auth, completeTour);

module.exports = router;

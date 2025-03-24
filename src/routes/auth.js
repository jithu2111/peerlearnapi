const express = require('express');
const router = express.Router();
const authService = require('../services/auth');

// Example routes
router.post('/login', authService.login);
router.post('/signup', authService.signup);

module.exports = router;

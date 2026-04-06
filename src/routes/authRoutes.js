const express = require('express');
const authController = require('../controllers/authController');
const { validateSignup, validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.post('/signup', validateSignup, validateRequest, authController.signup);
router.post('/login', authController.login);

module.exports = router;
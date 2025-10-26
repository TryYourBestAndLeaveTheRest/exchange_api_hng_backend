const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');

// GET /status - Show total countries and last refresh timestamp
router.get('/', countryController.getStatus);

module.exports = router;

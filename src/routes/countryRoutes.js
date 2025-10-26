const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');

// POST /countries/refresh - Fetch and cache country data
router.post('/refresh', countryController.refreshCountries);

// GET /countries/image - Serve summary image (must be before /:name to avoid conflict)
router.get('/image', countryController.getSummaryImage);

// GET /countries - Get all countries with filters
router.get('/', countryController.getAllCountries);

// GET /countries/:name - Get one country by name
router.get('/:name', countryController.getCountryByName);

// DELETE /countries/:name - Delete a country
router.delete('/:name', countryController.deleteCountry);

module.exports = router;

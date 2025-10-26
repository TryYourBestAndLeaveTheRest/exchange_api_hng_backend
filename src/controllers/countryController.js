const externalApiService = require('../services/externalApiService');
const countryModel = require('../models/countryModel');
const imageService = require('../services/imageService');
const { ApiError } = require('../middleware/errorHandler');

/**
 * POST /countries/refresh
 * Fetch all countries and exchange rates, then cache them in the database
 */
async function refreshCountries(req, res, next) {
  try {
    console.log('Starting country data refresh...');

    // Fetch and process country data
    let processedCountries;
    try {
      processedCountries = await externalApiService.processCountryData();
    } catch (error) {
      throw new ApiError(
        503,
        'External data source unavailable',
        error.message
      );
    }

    // Bulk upsert countries
    await countryModel.bulkUpsertCountries(processedCountries);

    // Update last refresh timestamp
    await countryModel.updateLastRefreshTimestamp();

    // Generate summary image
    const totalCountries = await countryModel.getCountryCount();
    const topCountries = await countryModel.getTopCountriesByGdp(5);
    const lastRefreshed = await countryModel.getLastRefreshTimestamp();

    await imageService.generateSummaryImage(totalCountries, topCountries, lastRefreshed);

    console.log('✅ Country data refresh completed');

    res.json({
      message: 'Countries refreshed successfully',
      total_countries: totalCountries,
      last_refreshed_at: lastRefreshed
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /countries
 * Get all countries from the DB with optional filters and sorting
 */
async function getAllCountries(req, res, next) {
  try {
    const filters = {};

    // Extract query parameters
    if (req.query.region) {
      filters.region = req.query.region;
    }

    if (req.query.currency) {
      filters.currency = req.query.currency;
    }

    if (req.query.sort) {
      filters.sort = req.query.sort;
    }

    const countries = await countryModel.getAllCountries(filters);

    res.json(countries);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /countries/:name
 * Get one country by name
 */
async function getCountryByName(req, res, next) {
  try {
    const { name } = req.params;
    const country = await countryModel.getCountryByName(name);

    if (!country) {
      throw new ApiError(404, 'Country not found');
    }

    res.json(country);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /countries/:name
 * Delete a country record
 */
async function deleteCountry(req, res, next) {
  try {
    const { name } = req.params;
    const deletedCountry = await countryModel.deleteCountryByName(name);

    if (!deletedCountry) {
      throw new ApiError(404, 'Country not found');
    }

    res.json({
      message: 'Country deleted successfully',
      country: deletedCountry
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /status
 * Show total countries and last refresh timestamp
 */
async function getStatus(req, res, next) {
  try {
    const totalCountries = await countryModel.getCountryCount();
    const lastRefreshed = await countryModel.getLastRefreshTimestamp();

    res.json({
      total_countries: totalCountries,
      last_refreshed_at: lastRefreshed
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /countries/image
 * Serve the summary image
 */
async function getSummaryImage(req, res, next) {
  try {
    const imageExists = await imageService.summaryImageExists();

    if (!imageExists) {
      return res.status(404).json({
        error: 'Summary image not found'
      });
    }

    const imagePath = imageService.getSummaryImagePath();
    res.sendFile(imagePath);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  refreshCountries,
  getAllCountries,
  getCountryByName,
  deleteCountry,
  getStatus,
  getSummaryImage
};

const axios = require('axios');
const config = require('../config/config');

/**
 * Fetch all countries from the external API
 */
async function fetchCountries() {
  try {
    const response = await axios.get(config.api.countriesUrl, {
      timeout: config.api.timeout
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Countries API request timed out');
    }
    throw new Error(`Could not fetch data from Countries API: ${error.message}`);
  }
}

/**
 * Fetch exchange rates from the external API
 */
async function fetchExchangeRates() {
  try {
    const response = await axios.get(config.api.exchangeRateUrl, {
      timeout: config.api.timeout
    });
    
    if (response.data && response.data.rates) {
      return response.data.rates;
    }
    throw new Error('Invalid exchange rate response format');
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Exchange Rate API request timed out');
    }
    throw new Error(`Could not fetch data from Exchange Rate API: ${error.message}`);
  }
}

/**
 * Process country data and match with exchange rates
 */
async function processCountryData() {
  try {
    // Fetch both APIs
    const [countries, exchangeRates] = await Promise.all([
      fetchCountries(),
      fetchExchangeRates()
    ]);

    // Process each country
    const processedCountries = countries.map(country => {
      // Extract currency code (first currency if multiple)
      let currencyCode = null;
      let exchangeRate = null;
      let estimatedGdp = null;

      if (country.currencies && country.currencies.length > 0) {
        currencyCode = country.currencies[0].code || null;
        
        // Get exchange rate for the currency
        if (currencyCode && exchangeRates[currencyCode]) {
          exchangeRate = exchangeRates[currencyCode];
          
          // Calculate estimated GDP: population × random(1000-2000) ÷ exchange_rate
          const randomMultiplier = Math.random() * 1000 + 1000; // Random between 1000-2000
          estimatedGdp = (country.population * randomMultiplier) / exchangeRate;
        }
      }

      // If no currencies, set GDP to 0
      if (!currencyCode) {
        estimatedGdp = 0;
      }

      return {
        name: country.name || null,
        capital: country.capital || null,
        region: country.region || null,
        population: country.population || 0,
        currency_code: currencyCode,
        exchange_rate: exchangeRate,
        estimated_gdp: estimatedGdp,
        flag_url: country.flag || null
      };
    });

    return processedCountries;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  fetchCountries,
  fetchExchangeRates,
  processCountryData
};

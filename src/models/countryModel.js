const db = require('../config/database');

/**
 * Get all countries with optional filters and sorting
 */
async function getAllCountries(filters = {}) {
  let query = 'SELECT * FROM countries WHERE 1=1';
  const params = [];

  // Apply filters
  if (filters.region) {
    query += ' AND region = ?';
    params.push(filters.region);
  }

  if (filters.currency) {
    query += ' AND currency_code = ?';
    params.push(filters.currency);
  }

  // Apply sorting
  if (filters.sort) {
    switch (filters.sort) {
      case 'gdp_desc':
        query += ' ORDER BY estimated_gdp DESC';
        break;
      case 'gdp_asc':
        query += ' ORDER BY estimated_gdp ASC';
        break;
      case 'population_desc':
        query += ' ORDER BY population DESC';
        break;
      case 'population_asc':
        query += ' ORDER BY population ASC';
        break;
      case 'name_asc':
        query += ' ORDER BY name ASC';
        break;
      case 'name_desc':
        query += ' ORDER BY name DESC';
        break;
      default:
        query += ' ORDER BY name ASC';
    }
  } else {
    query += ' ORDER BY name ASC';
  }

  const results = await db.query(query, params);
  return results;
}

/**
 * Get a single country by name (case-insensitive)
 */
async function getCountryByName(name) {
  const query = 'SELECT * FROM countries WHERE LOWER(name) = LOWER(?) LIMIT 1';
  const result = await db.queryOne(query, [name]);
  return result;
}

/**
 * Create or update a country
 */
async function upsertCountry(countryData) {
  const {
    name,
    capital,
    region,
    population,
    currency_code,
    exchange_rate,
    estimated_gdp,
    flag_url
  } = countryData;

  // Check if country exists
  const existing = await getCountryByName(name);

  if (existing) {
    // Update existing country
    const query = `
      UPDATE countries 
      SET capital = ?, 
          region = ?, 
          population = ?, 
          currency_code = ?, 
          exchange_rate = ?, 
          estimated_gdp = ?, 
          flag_url = ?,
          last_refreshed_at = NOW()
      WHERE LOWER(name) = LOWER(?)
    `;
    
    await db.query(query, [
      capital,
      region,
      population,
      currency_code,
      exchange_rate,
      estimated_gdp,
      flag_url,
      name
    ]);

    return await getCountryByName(name);
  } else {
    // Insert new country
    const query = `
      INSERT INTO countries 
      (name, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url, last_refreshed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const result = await db.query(query, [
      name,
      capital,
      region,
      population,
      currency_code,
      exchange_rate,
      estimated_gdp,
      flag_url
    ]);

    return await getCountryByName(name);
  }
}

/**
 * Bulk upsert countries
 */
async function bulkUpsertCountries(countries) {
  const results = [];
  
  for (const country of countries) {
    try {
      const result = await upsertCountry(country);
      results.push(result);
    } catch (error) {
      console.error(`Error upserting country ${country.name}:`, error.message);
      // Continue with other countries
    }
  }
  
  return results;
}

/**
 * Delete a country by name
 */
async function deleteCountryByName(name) {
  const country = await getCountryByName(name);
  
  if (!country) {
    return null;
  }

  const query = 'DELETE FROM countries WHERE LOWER(name) = LOWER(?)';
  await db.query(query, [name]);
  
  return country;
}

/**
 * Get total count of countries
 */
async function getCountryCount() {
  const query = 'SELECT COUNT(*) as count FROM countries';
  const result = await db.queryOne(query);
  return result ? result.count : 0;
}

/**
 * Get last refresh timestamp
 */
async function getLastRefreshTimestamp() {
  const query = "SELECT value FROM metadata WHERE key_name = 'last_refreshed_at'";
  const result = await db.queryOne(query);
  return result ? result.value : null;
}

/**
 * Update last refresh timestamp
 */
async function updateLastRefreshTimestamp() {
  const query = `
    UPDATE metadata 
    SET value = NOW(), updated_at = NOW() 
    WHERE key_name = 'last_refreshed_at'
  `;
  await db.query(query);
  
  return await getLastRefreshTimestamp();
}

/**
 * Get top countries by GDP
 */
async function getTopCountriesByGdp(limit = 5) {
  const query = `
    SELECT * FROM countries 
    WHERE estimated_gdp IS NOT NULL 
    ORDER BY estimated_gdp DESC 
    LIMIT ?
  `;
  const results = await db.query(query, [limit]);
  return results;
}

module.exports = {
  getAllCountries,
  getCountryByName,
  upsertCountry,
  bulkUpsertCountries,
  deleteCountryByName,
  getCountryCount,
  getLastRefreshTimestamp,
  updateLastRefreshTimestamp,
  getTopCountriesByGdp
};

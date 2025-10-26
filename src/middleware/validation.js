/**
 * Validate country data
 */
function validateCountry(data) {
  const errors = {};

  // Required fields
  if (!data.name || data.name.trim() === '') {
    errors.name = 'is required';
  }

  if (data.population === undefined || data.population === null) {
    errors.population = 'is required';
  } else if (typeof data.population !== 'number' || data.population < 0) {
    errors.population = 'must be a non-negative number';
  }

  if (!data.currency_code && data.currency_code !== null) {
    // currency_code can be null, but if provided must be valid
    if (data.currency_code !== undefined && data.currency_code.trim() === '') {
      errors.currency_code = 'must be a valid currency code or null';
    }
  }

  // Return validation result
  if (Object.keys(errors).length > 0) {
    return {
      valid: false,
      errors
    };
  }

  return {
    valid: true
  };
}

/**
 * Middleware to validate country creation/update
 */
function validateCountryMiddleware(req, res, next) {
  const validation = validateCountry(req.body);
  
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors
    });
  }

  next();
}

module.exports = {
  validateCountry,
  validateCountryMiddleware
};

const { z } = require('zod');

// Zod validation middleware for request body
const validateZod = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate and parse request body
      const validatedData = await schema.parseAsync(req.body);
      
      // Replace req.body with validated & transformed data
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format Zod errors into readable format
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
      
      // Handle unexpected errors
      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
      });
    }
  };
};

// Validate query parameters
const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedData = await schema.parseAsync(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: formattedErrors,
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

module.exports = {
  validateZod,
  validateQuery,
};
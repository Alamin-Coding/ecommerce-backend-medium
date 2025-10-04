const { z } = require('zod');

// Product validation schema
const productValidator = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name cannot exceed 200 characters')
    .trim(),
  
  description: z
    .string({ required_error: 'Description is required' })
    .min(10, 'Description must be at least 10 characters')
    .trim(),
  
  price: z
    .number({ required_error: 'Price is required' })
    .positive('Price must be a positive number')
    .or(z.string().transform((val) => parseFloat(val))),
  
  discountPrice: z
    .number()
    .positive('Discount price must be positive')
    .optional()
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !val || val >= 0, {
      message: 'Discount price must be positive',
    }),
  
  category: z
    .string({ required_error: 'Category is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format'),
  
  stock: z
    .number({ required_error: 'Stock is required' })
    .int('Stock must be an integer')
    .nonnegative('Stock cannot be negative')
    .or(z.string().transform((val) => parseInt(val, 10))),
  
  specifications: z
    .record(z.string())
    .optional(),
});

// Review validation schema
const reviewValidator = z.object({
  rating: z
    .number({ required_error: 'Rating is required' })
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5')
    .or(z.string().transform((val) => parseFloat(val))),
  
  comment: z
    .string({ required_error: 'Comment is required' })
    .min(10, 'Review must be at least 10 characters')
    .max(500, 'Review cannot exceed 500 characters')
    .trim(),
});

module.exports = {
  productValidator,
  reviewValidator,
};
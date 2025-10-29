const { z } = require('zod');

// Validation middleware factory
function validateRequest(schema) {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

// Auth schemas
const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const passwordChangeSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

// Project schemas
const projectCreateSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().min(1, 'Description is required'),
    category: z.string().min(1, 'Category is required'),
    year: z.string().optional(),
    coverImage: z.string().optional(),
    images: z.array(z.string()).optional(),
    role: z.string().optional(),
    tools: z.array(z.string()).optional(),
    challenges: z.string().optional(),
    solution: z.string().optional(),
    contentBlocks: z.array(z.any()).optional(),
    link: z.string().url().optional().or(z.literal('')),
    featured: z.boolean().optional(),
    id: z.string().optional(),
  }),
});

const projectUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).optional(),
    category: z.string().optional(),
    year: z.string().optional(),
    coverImage: z.string().optional(),
    images: z.array(z.string()).optional(),
    role: z.string().optional(),
    tools: z.array(z.string()).optional(),
    challenges: z.string().optional(),
    solution: z.string().optional(),
    contentBlocks: z.array(z.any()).optional(),
    link: z.string().url().optional().or(z.literal('')),
    featured: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

// Story schemas
const storyCreateSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().min(1, 'Description is required'),
    coverImage: z.string().optional(),
    images: z.array(z.string()).optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    date: z.string().optional(),
    content: z.string().optional(),
    contentBlocks: z.array(z.any()).optional(),
    id: z.string().optional(),
  }),
});

const storyUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).optional(),
    coverImage: z.string().optional(),
    images: z.array(z.string()).optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    date: z.string().optional(),
    content: z.string().optional(),
    contentBlocks: z.array(z.any()).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

// Message schema
const messageCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    email: z.string().email('Invalid email address'),
    subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
    message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  }),
});

// Category schemas
const categoryCreateSchema = z.object({
  body: z.object({
    label: z.string().min(1, 'Category label is required').max(100, 'Label too long'),
  }),
});

const categoryUpdateSchema = z.object({
  body: z.object({
    label: z.string().min(1, 'Category label is required').max(100, 'Label too long'),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

// Banned IP schema
const bannedIpCreateSchema = z.object({
  body: z.object({
    ip: z.string()
      .min(7, 'Invalid IP address')
      .regex(/^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i, 'Invalid IP address format'),
    reason: z.string().max(500, 'Reason too long').optional(),
  }),
});

// Upload schema
const uploadSchema = z.object({
  body: z.object({
    data: z.string().startsWith('data:', 'Invalid base64 image data'),
    filename: z.string().optional(),
    entityType: z.enum(['project', 'projects', 'story', 'stories', 'site', 'content'], {
      errorMap: () => ({ message: 'Invalid entity type' }),
    }),
    entityId: z.string().min(1, 'Entity ID is required'),
  }),
});

module.exports = {
  validateRequest,
  loginSchema,
  passwordChangeSchema,
  projectCreateSchema,
  projectUpdateSchema,
  storyCreateSchema,
  storyUpdateSchema,
  messageCreateSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  bannedIpCreateSchema,
  uploadSchema,
};

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production environment');
}

export const JWT_SECRET = process.env.JWT_SECRET || 'ecoblock-demo-secret-change-in-prod';

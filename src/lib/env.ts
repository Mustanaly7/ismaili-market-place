/**
 * Server-side environment configuration with safe defaults for local dev.
 * Public (browser-inlined) variables are read directly via
 * process.env.NEXT_PUBLIC_* inside client components.
 */
export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  sessionSecret:
    process.env.SESSION_SECRET ?? "dev-only-change-me-please-0123456789abcdef",
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? "",
    region: process.env.S3_REGION ?? "us-east-1",
    bucket: process.env.S3_BUCKET ?? "ismaili-media",
    accessKey: process.env.S3_ACCESS_KEY ?? "",
    secretKey: process.env.S3_SECRET_KEY ?? "",
    publicUrl: process.env.S3_PUBLIC_URL ?? "",
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },
  support: {
    phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "",
    whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "",
  },
};

export const isStripeEnabled = () => Boolean(env.stripe.secretKey);
export const isS3Enabled = () => Boolean(env.s3.endpoint && env.s3.accessKey);
export const isRedisConfigured = () => Boolean(env.redisUrl);export const isGoogleEnabled = () =>
  Boolean(env.google.clientId && env.google.clientSecret);
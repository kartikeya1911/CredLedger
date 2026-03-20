import dotenv from 'dotenv'
import path from 'path'
import { z } from 'zod'

const envPath = path.resolve(__dirname, '../../.env')
dotenv.config({ path: envPath })

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(8080),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  SEPOLIA_RPC_URL: z.string().optional(),
  OPERATOR_PRIVATE_KEY: z.string().optional(),
  ESCROW_FACTORY_ADDRESS: z.string().optional(),
  UPI_WEBHOOK_SECRET: z.string().default('change_me'),
})

export const env = envSchema.parse(process.env)


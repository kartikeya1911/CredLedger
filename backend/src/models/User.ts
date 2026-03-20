import { Schema, model, type InferSchemaType } from 'mongoose'

const userSchema = new Schema(
  {
    role: { type: String, enum: ['CLIENT', 'FREELANCER', 'ADMIN', 'ARBITRATOR'], required: true },
    email: { type: String, index: true, sparse: true },
    phone: { type: String, index: true, sparse: true },
    passwordHash: { type: String, required: true },
    walletAddress: { type: String },
    kyc: {
      status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
      providerRef: { type: String },
      submittedAt: { type: Date },
      verifiedAt: { type: Date },
    },
    upi: {
      vpa: { type: String },
      payoutProfileId: { type: String },
    },
    profile: {
      name: { type: String },
      bio: { type: String },
      skills: [{ type: String }],
    },
  },
  { timestamps: true },
)

export type User = InferSchemaType<typeof userSchema>
export const UserModel = model('User', userSchema)


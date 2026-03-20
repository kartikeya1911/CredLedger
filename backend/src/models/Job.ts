import { Schema, model, Types, type InferSchemaType } from 'mongoose'

const jobSchema = new Schema(
  {
    clientId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    skills: [{ type: String }],
    budget: {
      currency: { type: String, enum: ['INR'], default: 'INR' },
      totalAmountPaise: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
      index: true,
    },
    selectedFreelancerId: { type: Types.ObjectId, ref: 'User', index: true },
    applications: {
      type: [
        {
          freelancerId: { type: Types.ObjectId, ref: 'User', required: true },
          coverLetter: { type: String },
          bidPaise: { type: Number },
          status: { type: String, enum: ['APPLIED', 'ACCEPTED', 'REJECTED'], default: 'APPLIED' },
          appliedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    escrow: {
      escrowId: { type: String },
      chainId: { type: Number, default: 11155111 },
      contractAddress: { type: String },
    },
  },
  { timestamps: true },
)

export type Job = InferSchemaType<typeof jobSchema>
export const JobModel = model('Job', jobSchema)


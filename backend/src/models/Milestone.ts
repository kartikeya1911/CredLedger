import { Schema, model, Types, type InferSchemaType } from 'mongoose'

const milestoneSchema = new Schema(
  {
    jobId: { type: Types.ObjectId, ref: 'Job', required: true, index: true },
    index: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    amountPaise: { type: Number, required: true },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'AWAITING_FUNDING',
        'FUNDED_PENDING_CHAIN',
        'FUNDED',
        'SUBMITTED',
        'APPROVED',
        'REJECTED',
        'RELEASE_AUTHORIZED',
        'RELEASED',
        'DISPUTED',
        'REFUND_AUTHORIZED',
        'REFUNDED',
      ],
      default: 'DRAFT',
      index: true,
    },
    submission: {
      message: { type: String },
      attachments: [{ type: String }],
      submittedAt: { type: Date },
      submitHash: { type: String },
      submitLink: { type: String },
    },
    approval: {
      approvedAt: { type: Date },
      note: { type: String },
    },
    chain: {
      escrowAddress: { type: String },
      milestoneIdOnchain: { type: Number },
      lastTxHash: { type: String },
    },
  },
  { timestamps: true },
)

milestoneSchema.index({ jobId: 1, index: 1 }, { unique: true })

export type Milestone = InferSchemaType<typeof milestoneSchema>
export const MilestoneModel = model('Milestone', milestoneSchema)


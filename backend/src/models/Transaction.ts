import { Schema, model, Types, type InferSchemaType } from 'mongoose'

const transactionSchema = new Schema(
  {
    type: { type: String, enum: ['UPI_COLLECT', 'UPI_PAYOUT', 'CHAIN_TX'], required: true, index: true },
    jobId: { type: Types.ObjectId, ref: 'Job', index: true },
    milestoneId: { type: Types.ObjectId, ref: 'Milestone', index: true },
    userId: { type: Types.ObjectId, ref: 'User', index: true },
    amountPaise: { type: Number, required: true },
    currency: { type: String, enum: ['INR'], default: 'INR' },
    status: { type: String, enum: ['CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'REVERSED'], default: 'CREATED', index: true },
    provider: {
      name: { type: String },
      orderId: { type: String, index: true, sparse: true },
      paymentId: { type: String, sparse: true },
      signature: { type: String },
      rawWebhookIds: [{ type: String }],
    },
    chain: {
      chainId: { type: Number },
      txHash: { type: String, index: true, sparse: true },
      contractAddress: { type: String },
      eventName: { type: String },
    },
    idempotencyKey: { type: String, index: true, sparse: true },
  },
  { timestamps: true },
)

export type Transaction = InferSchemaType<typeof transactionSchema>
export const TransactionModel = model('Transaction', transactionSchema)


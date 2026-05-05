import mongoose, { Schema, Model } from 'mongoose'

export type BillStatus = 'open' | 'paid'

export interface IBill {
  _id?: string
  tableIds: string[]
  status: BillStatus
  createdAt?: Date
  closedAt?: Date
}

const BillSchema = new Schema<IBill>(
  {
    tableIds: { type: [String], required: true },
    status: {
      type: String,
      enum: ['open', 'paid'],
      default: 'open',
    },
    closedAt: { type: Date },
  },
  { timestamps: true }
)

export const Bill: Model<IBill> =
  mongoose.models.Bill ?? mongoose.model<IBill>('Bill', BillSchema)

import mongoose, { Schema, Model } from 'mongoose'

export type RequestType = 'call_waiter' | 'request_bill'
export type RequestStatus = 'pending' | 'done'

export interface ITableRequest {
  _id?: string
  tableId: string
  type: RequestType
  status: RequestStatus
  createdAt?: Date
  updatedAt?: Date
}

const TableRequestSchema = new Schema<ITableRequest>(
  {
    tableId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['call_waiter', 'request_bill'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'done'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

export const TableRequest: Model<ITableRequest> =
  mongoose.models.TableRequest ??
  mongoose.model<ITableRequest>('TableRequest', TableRequestSchema)

import mongoose, { Schema, Document, Model } from 'mongoose'

export type OrderStatus = 'pending' | 'preparing' | 'served'

export interface IOrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

export interface IOrder {
  _id?: string
  tableId: string
  items: IOrderItem[]
  status: OrderStatus
  total: number
  createdAt?: Date
  updatedAt?: Date
}

const OrderItemSchema = new Schema<IOrderItem>({
  menuItemId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
})

const OrderSchema = new Schema<IOrder>(
  {
    tableId: { type: String, required: true },
    items: [OrderItemSchema],
    status: {
      type: String,
      enum: ['pending', 'preparing', 'served'],
      default: 'pending',
    },
    total: { type: Number, required: true },
  },
  { timestamps: true }
)

export const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>('Order', OrderSchema)

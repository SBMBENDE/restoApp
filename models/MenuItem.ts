import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IMenuItem {
  _id?: string
  name: string
  description: string
  price: number
  category: string
  image: string
  available: boolean
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, default: '' },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const MenuItem: Model<IMenuItem> =
  mongoose.models.MenuItem ?? mongoose.model<IMenuItem>('MenuItem', MenuItemSchema)

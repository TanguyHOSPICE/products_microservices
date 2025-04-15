import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type ProductDocument = mongoose.HydratedDocument<Product>;

@Schema({ timestamps: true, versionKey: false })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, default: 0 })
  stock: number;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category' })
  category_id: mongoose.Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

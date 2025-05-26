// ------------------------------
// 🟢 1. Product Schema (Refactored)
// ------------------------------
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type ProductDocument = mongoose.HydratedDocument<Product>;

@Schema({ timestamps: true, versionKey: false })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop() description?: string;
  @Prop({ required: true }) price: number;
  @Prop({ default: 0 }) stock: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  users: Types.ObjectId[];

  @Prop({
    type: [
      {
        sizes: {
          h: { type: Number },
          w: { type: Number },
        },
        urls: {
          type: [String],
          validate: [
            (val: string[]) => val.every((url) => /^https?:\/\//.test(url)),
            'URLs invalides',
          ],
          maxlength: [5, 'Pas plus de 5 URLs'],
          default: [],
        },
      },
    ],
    default: [],
  })
  images: {
    sizes: { h: number; w: number };
    urls: string[];
  }[];

  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ type: [String], default: [] }) categories: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'DeliveryRules' }], default: [] })
  deliveryRules: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'ProductStatus' }] })
  status: Types.ObjectId;

  @Prop() rating?: number;
  @Prop() ratingCount?: number;
  @Prop() reviews?: number;
  @Prop() brand?: string;
  @Prop() color?: string;
  @Prop() material?: string;
  @Prop() warranty?: string;
  @Prop() shipping?: string;
  @Prop() returnPolicy?: string;

  @Prop({
    type: {
      units: { type: [String], default: ['cm'] },
      length: Number,
      width: Number,
      height: Number,
      depth: Number,
    },
    default: {},
  })
  size?: {
    units: string[];
    length?: number;
    width?: number;
    height?: number;
    depth?: number;
  };
}

export const ProductSchema = SchemaFactory.createForClass(Product);

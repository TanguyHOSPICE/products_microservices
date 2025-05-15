import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type ProductDocument = mongoose.HydratedDocument<Product>;

@Schema({ timestamps: true, versionKey: false })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0 })
  stock: number;

  /**
   * Référence à un ou plusieurs utilisateurs (ex: vendeurs ou créateurs du produit)
   * Chaque ObjectId fait le lien avec un document de la collection "users"
   */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  users: Types.ObjectId[];

  /**
   * Images list  :
   * - sizes: taille de l’image
   * - urls: tableau d’URLs de différentes résolutions
   */
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

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  categories: string[];

  @Prop({ default: true })
  is_active: boolean;

  @Prop()
  image?: string; // Image principale, souvent images[0].urls[0]

  @Prop()
  rating?: number;

  /**
   * Nombre total d’avis reçus.
   * Sert à afficher "⭐⭐⭐ 4.5 (127 avis)"
   */
  @Prop()
  reviews?: number;

  @Prop()
  isFavorite?: boolean;

  @Prop()
  isInCart?: boolean;

  @Prop()
  quantity?: number;

  @Prop()
  isInWishlist?: boolean;

  @Prop()
  isInCompare?: boolean;

  @Prop()
  isInStock?: boolean;

  @Prop()
  isOnSale?: boolean;

  @Prop()
  discount?: number;

  @Prop()
  brand?: string;

  @Prop()
  color?: string;

  @Prop()
  material?: string;

  @Prop()
  warranty?: string;

  @Prop()
  shipping?: string;

  @Prop()
  returnPolicy?: string;

  @Prop()
  isAvailable?: boolean;

  @Prop()
  isFeatured?: boolean;

  @Prop()
  isNew?: boolean;

  @Prop()
  isBestSeller?: boolean;

  @Prop()
  isLimitedEdition?: boolean;

  @Prop()
  isExclusive?: boolean;

  @Prop()
  isPreOrder?: boolean;

  @Prop()
  isBackOrder?: boolean;

  @Prop()
  isComingSoon?: boolean;

  @Prop()
  isOutOfStock?: boolean;

  @Prop()
  isDiscontinued?: boolean;

  @Prop()
  isArchived?: boolean;

  /**
   * Dimensions du produit avec unité(s) (ex: ["cm", "in"]) et dimensions possibles.
   */
  @Prop({
    type: {
      units: { type: [String], default: ['cm'] },
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      depth: { type: Number },
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

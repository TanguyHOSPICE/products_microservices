import e from 'express';
import { ProductResponseDto } from '../../products/dtos/productResponse.dto';
import { arch } from 'node:os';
// TODO:adapt to the service and remove the private into the service
export function mapToProductResponseDto(
  product: any,
  status: any,
): ProductResponseDto {
  return {
    _id: product._id.toString(),
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,

    users: product.users?.map((u) => u.toString()) || [],

    images: product.images,
    tags: product.tags,
    categories: product.categories,

    deliveryRules: product.deliveryRules?.map((d) => d.toString()) || [],

    status,

    rating: product.rating,
    ratingCount: product.ratingCount,
    reviews: product.reviews,

    brand: product.brand,
    color: product.color,
    material: product.material,
    warranty: product.warranty,
    shipping: product.shipping,
    returnPolicy: product.returnPolicy,

    sizes: product.sizes,
    salesPeriods: product.salesPeriods,

    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export const tagToStatusFieldMap = {
  actif: 'isActive',
  available: 'isAvailable',
  featured: 'isFeatured',
  new: 'isNewProduct',
  bestseller: 'isBestSeller',
  limited: 'isLimitedEdition',
  exclusive: 'isExclusive',
  preorder: 'isPreOrder',
  backorder: 'isBackOrder',
  comingsoon: 'isComingSoon',
  outofstock: 'isOutOfStock',
  discountinued: 'isDiscontinued',
  archived: 'isArchived',
  promo: 'isOnSale',
  instock: 'isInStock',
  compare: 'isInCompare',
  wishlist: 'isInWishlist',
  cart: 'isInCart',
  favorite: 'isFavorite',
  discount: 'isDiscounted',
};

export function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim().replace(/[-\s]/g, '_');
}

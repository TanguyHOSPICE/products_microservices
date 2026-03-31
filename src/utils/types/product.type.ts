import { CreateProductDto } from 'src/products/dtos/create-product.dto';
import { Product } from 'src/products/schema/product.schema';
import { EnumSalesPeriodType } from '../enums/EnumSalesPeriod';

export type ProductWithPrice = Product & {
  finalPrice: number;
};

export type ManualStatusInput = NonNullable<CreateProductDto['manualStatus']>;

export type Status = Partial<{
  isBestSeller: boolean;
  isFeatured: boolean;
  isExclusive: boolean;
  isLimitedEdition: boolean;
  isArchived: boolean;

  isPreOrder: boolean;
  isBackOrder: boolean;
  isComingSoon: boolean;

  isPromo: boolean;
  isDiscounted: boolean;

  isInAd: boolean;
  isAvailable: boolean;

  isInStock: boolean;
  isOutOfStock: boolean;
  isOnSale: boolean;
  isNewProduct: boolean;
}>;

export type ActiveFuturePeriod = {
  start: Date;
  end: Date;
  type: EnumSalesPeriodType;
  name: string;
  discount: {
    type: 'PERCENT' | 'FIXED';
    value: number;
  };
};

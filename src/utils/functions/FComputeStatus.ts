import { Product } from 'src/products/schema/product.schema';
import { ActiveFuturePeriod, Status } from '../types/product.type';

export function computeAutomaticStatus(product: Partial<Product>): Status {
  const now = new Date();

  const status: Status = {};

  // STOCK
  if ((product.stock ?? 0) > 0) {
    status.isInStock = true;
    status.isOutOfStock = false;
    status.isAvailable = true;
  } else {
    status.isInStock = false;
    status.isOutOfStock = true;
    status.isAvailable = false;
  }

  // SALES PERIOD
  const activePeriod: ActiveFuturePeriod | undefined =
    product.salesPeriods?.find(
      (p) => now >= new Date(p.start) && now <= new Date(p.end),
    );

  if (activePeriod) {
    status.isOnSale = true;
    status.isDiscounted = true;
    status.isPromo = true;
  } else {
    status.isOnSale = false;
    status.isDiscounted = false;
    status.isPromo = false;
  }

  // COMING SOON
  const futurePeriod: ActiveFuturePeriod | undefined =
    product.salesPeriods?.find((p) => now < new Date(p.start));

  if (futurePeriod) {
    status.isComingSoon = true;
  }

  // NEW PRODUCT
  if (product.createdAt) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    status.isNewProduct = product.createdAt > oneMonthAgo;
  }

  return status;
}

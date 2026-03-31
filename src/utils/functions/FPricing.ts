import { Product } from 'src/products/schema/product.schema';

export function getActiveDiscount(product: Product) {
  const now = new Date();

  const activePeriod = product.salesPeriods?.find(
    (p) => now >= new Date(p.start) && now <= new Date(p.end),
  );

  if (!activePeriod) return null;

  return activePeriod.discount;
}

export function getFinalPrice(product: Product): number {
  const discount: { type: 'PERCENT' | 'FIXED'; value: number } =
    getActiveDiscount(product);

  if (!discount) return product.price;
  // If the discount is a percentage, we calculate the final price by applying the percentage discount to the original price. If it's a fixed amount, we simply subtract it from the original price.
  if (discount.type === 'PERCENT') {
    return product.price * (1 - discount.value / 100);
  }

  return product.price - discount.value;
}

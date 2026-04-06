import { SalesPeriodsDto } from 'src/products/dtos/salesPeriods.dto';
import { Product } from 'src/products/schema/product.schema';
import { ManualStatusInput, Status } from '../types/product.type';

export function validateSalesPeriods(salesPeriods?: SalesPeriodsDto[]): void {
  if (!salesPeriods || salesPeriods.length === 0) return;

  // 🔹 1. Check start < end
  for (const period of salesPeriods) {
    if (period.start >= period.end) {
      throw new Error(
        `Periods "${period.name}" has an invalid date (start >= end)`,
      );
    }
  }

  // 🔹 2. Sort by start date
  const sorted = [...salesPeriods].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );

  // 🔹 3. Check for overlaps
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (current.end.getTime() > next.start.getTime()) {
      throw new Error(`Periods "${current.name}" and "${next.name}" overlap`);
    }
  }

  // 🔥 4. BONUS → only one active promotion at any given time
  const now = new Date();

  const activePeriods = salesPeriods.filter(
    (p) => now >= p.start && now <= p.end,
  );

  if (activePeriods.length > 1) {
    throw new Error(
      'Multiple active promotions at the same time are not allowed',
    );
  }
}

export function validateManualStatus(
  product: Partial<Product>,
  manual?: ManualStatusInput,
): Status {
  if (!manual) return {};

  const validated: Status = {};

  // 🟢 MANUAL PUR
  if (manual.isBestSeller !== undefined)
    validated.isBestSeller = manual.isBestSeller;

  if (manual.isFeatured !== undefined) validated.isFeatured = manual.isFeatured;

  if (manual.isExclusive !== undefined)
    validated.isExclusive = manual.isExclusive;

  if (manual.isLimitedEdition !== undefined)
    validated.isLimitedEdition = manual.isLimitedEdition;

  if (manual.isArchived !== undefined) validated.isArchived = manual.isArchived;

  if (manual.isInAd !== undefined) validated.isInAd = manual.isInAd;

  // 🔥 HYBRID

  // PREORDER
  if (manual.isPreOrder !== undefined) {
    if (manual.isPreOrder) {
      // Optionnal : warning logique
      if ((product.stock ?? 0) > 0) {
        console.warn('⚠️ PreOrder activated on a product with stock available');
      }
    }

    validated.isPreOrder = manual.isPreOrder;
  }

  // BACKORDER
  if (manual.isBackOrder !== undefined) {
    if ((product.stock ?? 0) > 0 && manual.isBackOrder) {
      console.warn('⚠️ Back Order useless if stock available');
    }

    validated.isBackOrder = manual.isBackOrder;
  }

  // COMING SOON
  if (manual.isComingSoon !== undefined) {
    const hasFuture = product.salesPeriods?.some(
      (p) => new Date(p.start) > new Date(),
    );

    if (!hasFuture && manual.isComingSoon) {
      throw new Error('Coming Soon impossible without a future date');
    }

    validated.isComingSoon = manual.isComingSoon;
  }

  // PROMO / DISCOUNT
  if (manual.isPromo || manual.isDiscounted) {
    const hasDiscount = product.salesPeriods?.some((p) => p.discount);

    if (!hasDiscount) {
      throw new Error('Promo impossible without a discount');
    }

    validated.isPromo = manual.isPromo;
    validated.isDiscounted = manual.isDiscounted;
  }

  // AVAILABLE
  if (manual.isAvailable !== undefined) {
    if ((product.stock ?? 0) === 0 && manual.isAvailable) {
      throw new Error('Product unavailable (stock 0)');
    }

    validated.isAvailable = manual.isAvailable;
  }

  return validated;
}

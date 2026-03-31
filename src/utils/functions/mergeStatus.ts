import { Status } from '../types/product.type';

export function mergeStatus(manual: Status, auto: Status): Status {
  return {
    ...auto,

    // override allowed
    isBestSeller: manual.isBestSeller ?? auto.isBestSeller,
    isFeatured: manual.isFeatured ?? auto.isFeatured,
    isExclusive: manual.isExclusive ?? auto.isExclusive,
    isLimitedEdition: manual.isLimitedEdition ?? auto.isLimitedEdition,
    isArchived: manual.isArchived ?? auto.isArchived,

    isPreOrder: manual.isPreOrder ?? auto.isPreOrder,
    isBackOrder: manual.isBackOrder ?? auto.isBackOrder,
    isComingSoon: manual.isComingSoon ?? auto.isComingSoon,

    isPromo: manual.isPromo ?? auto.isPromo,
    isDiscounted: manual.isDiscounted ?? auto.isDiscounted,

    isInAd: manual.isInAd ?? auto.isInAd,
    isAvailable: manual.isAvailable ?? auto.isAvailable,
  };
}

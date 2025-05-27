import { IProductStatusPayload } from '../interfaces/interfaces';

export const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

export const tagToStatusFieldMap: Record<string, keyof IProductStatusPayload> =
  {
    limited: 'isLimitedEdition',
    coming_soon: 'isComingSoon',
    exclusive: 'isExclusive',
    best_seller: 'isBestSeller',
    pre_order: 'isPreOrder',
    back_order: 'isBackOrder',
    discontinued: 'isDiscontinued',
    archived: 'isArchived',
    promo: 'isPromo',
    in_ad: 'isInAd',
  };

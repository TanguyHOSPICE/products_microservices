import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  DiscountType,
  EnumSalesPeriodType,
} from 'src/utils/enums/EnumSalesPeriod';

export class DiscountDto {
  @IsEnum(DiscountType)
  type: DiscountType;

  @IsNumber()
  @ValidateIf((o) => o.type === DiscountType.PERCENT)
  @Max(100, {
    message: 'Le pourcentage ne peut pas dépasser 100%',
  })
  value: number;
}
export class SalesPeriodsDto {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  start: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  end: Date;

  @IsNotEmpty()
  @IsEnum(EnumSalesPeriodType)
  type: EnumSalesPeriodType;
  @IsNotEmpty()
  @IsString()
  name: string;
  @ValidateNested()
  @Type(() => DiscountDto)
  discount: DiscountDto;
}

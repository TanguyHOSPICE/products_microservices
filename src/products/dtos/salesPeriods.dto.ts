import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EnumSalesPeriodType } from 'src/utils/enums/EnumSalesPeriod';

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
}

import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SizeDto } from './size.dto';
import { ImageDto } from './image.dto';
import { SalesPeriodsDto } from './salesPeriods.dto';

export class QueryProductsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  stock?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  users?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images?: ImageDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliveryRules?: string[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  rating?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ratingCount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  reviews?: number;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  warranty?: string;

  @IsOptional()
  @IsString()
  shipping?: string;

  @IsOptional()
  @IsString()
  returnPolicy?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SizeDto)
  sizes?: SizeDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesPeriodsDto)
  salesPeriods?: SalesPeriodsDto[];
}

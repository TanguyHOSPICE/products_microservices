import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ImageDto } from './image.dto';
import { SizeDto } from './size.dto';
import { SalesPeriodsDto } from './salesPeriods.dto';
import { Type } from 'class-transformer';

export class ProductResponseDto {
  @IsString()
  @IsNotEmpty()
  _id: string;
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
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
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsNumber()
  ratingCount?: number;

  @IsOptional()
  @IsNumber()
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

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

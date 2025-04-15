import {
  IsString,
  IsNumber,
  IsOptional,
  IsMongoId,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
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
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsMongoId()
  category_id: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

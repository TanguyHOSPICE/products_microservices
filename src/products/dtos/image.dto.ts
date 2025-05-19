import {
  IsArray,
  IsOptional,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ImageSizeDto } from './ImageSize.dto';

export class ImageDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageSizeDto)
  sizes?: ImageSizeDto;

  @IsArray()
  @IsUrl({}, { each: true })
  @MaxLength(5, { each: false })
  urls: string[];
}

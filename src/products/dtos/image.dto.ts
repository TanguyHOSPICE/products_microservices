import {
  ArrayMaxSize,
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
  @ArrayMaxSize(5, {
    message: 'A maximum of 5 URLs is allowed',
  })
  urls: string[];
}

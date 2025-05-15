import { IsArray, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SizeDimensionsDto } from './size-dimensions.dto';

export class ImageDto {
  @ValidateNested()
  @Type(() => SizeDimensionsDto)
  sizes: SizeDimensionsDto;

  @IsArray()
  @IsUrl(undefined, { each: true })
  urls: string[];
}

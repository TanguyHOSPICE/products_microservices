import { IsNumber } from 'class-validator';

export class ImageSizeDto {
  @IsNumber()
  h: number;

  @IsNumber()
  w: number;
}

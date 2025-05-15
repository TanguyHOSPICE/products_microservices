import { IsNumber } from 'class-validator';

export class SizeDimensionsDto {
  @IsNumber()
  h: number;

  @IsNumber()
  w: number;
}

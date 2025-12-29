import { IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSignalDto {
  @IsString()
  asset: string;

  @IsEnum(['BUY', 'SELL'])
  direction: 'BUY' | 'SELL';

  @Type(() => Number)
  @IsNumber()
  expiry: number;

  @Type(() => Number)          // 🔥 THIS FIXES IT
  @IsNumber()
  entryPrice: number;
}

import { IsString, IsOptional, IsNumber, Min ,IsArray} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() @Min(0) balance?: number;
  @IsOptional() @IsString() phone?: string;
   @IsOptional() @IsString() twoFactorSecret?: string;
   @IsOptional() @IsString() parentAffiliate?: string;
  @IsOptional() @IsArray() promoCodes?: { code: string; discount: number }[];
  
}
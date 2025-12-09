import { IsString, IsOptional } from 'class-validator';

export class CreateAffiliateDto {
  @IsString()
  @IsOptional()
  code?: string;
}
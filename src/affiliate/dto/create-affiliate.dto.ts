import { IsString } from 'class-validator';

export class JoinAffiliateDto {
  @IsString() code: string;
}
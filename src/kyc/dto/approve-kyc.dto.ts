import { IsString, IsOptional } from 'class-validator';

export class ApproveKycDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

import { Controller, Post, Param, Body, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/role.guard';
import { KycService } from './kyc.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApproveKycDto } from './dto/approve-kyc.dto'; 

@Controller('kyc')
export class KycController {
  constructor(private kycService: KycService) {}

  @Post('submit/:userId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  submit(@Param('userId') userId: string, @UploadedFiles() files: Express.Multer.File[], @Body() body: any) {
    return this.kycService.submit(userId, { files, ...body });
  }

  @Post('approve/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  approve(@Param('userId') userId: string, @Body() dto: ApproveKycDto) {
    return this.kycService.approve(userId, dto);
  }
}

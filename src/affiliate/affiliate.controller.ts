import { Controller, Get, Post, Param, UseGuards, Request, Body } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard, Roles } from 'src/auth/guards/role.guard';

@UseGuards(JwtAuthGuard)
@Controller('affiliate')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Get('dashboard')
  async dashboard(@Request() req) {
    const userId = req.user?.userId;
    return this.affiliateService.getDashboard(userId);
  }

  @Post('generate-link')
  async generateLink(@Request() req) {
    const userId = req.user?.userId;
    return this.affiliateService.generateReferralLink(userId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('approve/:userId')
  async approve(@Param('userId') userId: string) {
    return this.affiliateService.approveAffiliate(userId);
  }

  @Post('join')
  async join(@Request() req, @Body('code') code: string) {
    const userId = req.user?.userId;
    return this.affiliateService.join(userId, code);
  }
}

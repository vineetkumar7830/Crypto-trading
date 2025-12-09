import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('affiliate')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Get('dashboard')
  async dashboard(@Request() req) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    return this.affiliateService.getDashboard(userId);
  }

  @Get('referrals')
  async getReferrals(@Request() req) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    return this.affiliateService.getReferrals(userId);
  }

  @Get('commissions-by-referral')
  async getCommissionsByReferral(@Request() req) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    return this.affiliateService.getCommissionsByReferral(userId);
  }

  @Post('add/:affiliateId')
  async addCommission(@Param('affiliateId') affiliateId: string, @Body('amount') amount: number) {
    return this.affiliateService.addCommission(affiliateId, Number(amount));
  }

  @Post('generate-link')
  async generateLink(@Request() req) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    return this.affiliateService.generateReferralLink(userId);
  }
}

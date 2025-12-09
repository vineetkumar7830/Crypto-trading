import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  async getDashboard(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.dashboard.getFullDashboard(userId);
  }

  @Get('portfolio')
  async getPortfolio(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.dashboard.getPortfolio(userId);
  }

  @Get('pnl')
  async getPnL(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.dashboard.getPnL(userId);
  }

  @Get('fees')
  async getFees(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.dashboard.getFeeSummary(userId);
  }

  @Get('affiliate')
  async getAffiliate(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.dashboard.getAffiliateEarnings(userId);
  }
}
  
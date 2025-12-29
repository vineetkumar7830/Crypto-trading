import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  private getUserId(req: any) {
    return req.user?.userId || req.user?.id || req.user?._id || req.user?.sub || null;
  }

  @Get()
  async getDashboard(@Request() req) {
    const userId = this.getUserId(req);

    if (!userId) {
      return {
        statusCode: 401,
        message: 'Invalid token: userId missing',
        result: null,
      };
    }

    return await this.dashboard.getFullDashboard(userId);
  }
  
  @Get('affiliate')
  async getAffiliate(@Request() req) {
    const userId = this.getUserId(req);

    if (!userId) {
      return {
        statusCode: 401,
        message: 'Invalid token: userId missing',
        result: null,
      };
    }

    return await this.dashboard.getAffiliateDashboard(userId);
  }
}

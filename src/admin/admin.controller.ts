import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; 
import { RolesGuard, Roles } from '../auth/guards/role.guard';
import { AdminService } from './admin.service';
import { PriceService } from 'src/price/price.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt')) 
export class AdminController {
  constructor(
    private adminService: AdminService,
    private priceService: PriceService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('users')
  getUsers() {
    return this.adminService.getAllUsers();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('trades')
  getTrades() {
    return this.adminService.getAllTrades();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('commissions-summary')
  getCommissions() {
    return this.adminService.getCommissionsSummary();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('kyc/approve/:id')
  approveKyc(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
  ) {
    return this.adminService.approveKyc(id, body);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('set-price/:symbol')
  setPrice(@Param('symbol') symbol: string, @Body('price') price: number) {
    return this.priceService.setCustomPrice(symbol, price);
  }

  // 🔒 Only admin can view affiliates
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('affiliates/all')
  getAllAffiliates() {
    return this.adminService.getAllAffiliates();
  }

  // 🔒 Only admin can see bonus summary
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('bonuses/summary')
  getBonusSummary() {
    return this.adminService.getTotalBonuses();
  }
}

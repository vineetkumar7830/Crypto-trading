// src/admin/admin.controller.ts
import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/guards/role.guard';
import { AdminService } from './admin.service';
import { PriceService } from 'src/price/price.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard) // RolesGuard applied globally for this controller
export class AdminController {
  constructor(
    private adminService: AdminService,
    private priceService: PriceService,
  ) {}

  // ✅ Admin-only routes
  @Roles('admin')
  @Get('users')
  getUsers() {
    return this.adminService.getAllUsers();
  }

  @Roles('admin')
  @Get('trades')
  getTrades() {
    return this.adminService.getAllTrades();
  }

  @Roles('admin')
  @Get('commissions-summary')
  getCommissions() {
    return this.adminService.getCommissionsSummary();
  }

  @Roles('admin')
  @Post('kyc/approve/:id')
  approveKyc(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
  ) {
    return this.adminService.approveKyc(id, body);
  }

  @Roles('admin')
  @Post('affiliate/approve/:id')
  approveAffiliate(@Param('id') id: string) {
    return this.adminService.approveAffiliate(id);
  }

  @Roles('admin')
  @Post('set-price/:symbol')
  setPrice(@Param('symbol') symbol: string, @Body('price') price: number) {
    return this.priceService.setCustomPrice(symbol, price);
  }

  @Roles('admin')
  @Get('affiliates/all')
  getAllAffiliates() {
    return this.adminService.getAllAffiliates();
  }

  @Roles('admin')
  @Get('bonuses/summary')
  getBonusSummary() {
    return this.adminService.getTotalBonuses();
  }

  // ✅ Optional route for both admin & user (example)
  // Agar aise koi route chahiye jo user bhi access kare
  // @Roles('admin', 'user')
  // @Get('some-route')
  // someRoute() {
  //   return this.adminService.someMethod();
  // }
}

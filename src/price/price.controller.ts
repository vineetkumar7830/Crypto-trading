import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { RolesGuard, Roles } from '../auth/guards/role.guard';
import { PriceService } from './price.service';

@Controller('prices')
export class PriceController {
  constructor(private priceService: PriceService) {}

  @Get(':symbol')
  getPrice(@Param('symbol') symbol: string) {
    return this.priceService.getPrice(symbol);
  }
  
  @Post('set/:symbol')
  @UseGuards(RolesGuard)
  @Roles('admin')
  setCustomPrice(@Param('symbol') symbol: string, @Body('price') price: number) {
    return this.priceService.setCustomPrice(symbol, price);
  }
}
import { Controller, Post, Get, Param, Body, UseGuards,Query, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TradeService } from './trade.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { SELF_DECLARED_DEPS_METADATA } from '@nestjs/common/constants';

@Controller('trades')
export class TradeController {
  constructor(private tradeService: TradeService) {}

  @Post('buy')
  @UseGuards(JwtAuthGuard)
  buy(@Body() dto: any, @Request() req) {
    return this.tradeService.createTrade(dto, 'buy', req.user.userId);
  }

  @Post('sell')
  @UseGuards(JwtAuthGuard)
  sell(@Body() dto: any, @Request() req) {
    return this.tradeService.createTrade(dto, 'sell', req.user.userId);
  }

  @Get('history/open/:userId')
  @UseGuards(JwtAuthGuard)
  getOpen(@Param('userId') userId: string) {
    return this.tradeService.getHistory(userId, 'open');
  }
  
  @Get('history/closed/:userId')
  @UseGuards(JwtAuthGuard)
  getClosed(@Param('userId') userId: string) {
    return this.tradeService.getHistory(userId, 'closed');
  }

  @Get('filter')
  @UseGuards(JwtAuthGuard)
  filter(@Query() query: any, @Request() req) {
    console.log('req fo ',req.user)
    return this.tradeService.filterTrades(req.user.userId, query);
  }
}
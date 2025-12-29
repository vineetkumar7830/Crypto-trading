import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TradeService } from './trade.service';

@Controller('trade')
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Post('buy')
  @UseGuards(JwtAuthGuard)
  buy(@Request() req, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new UnauthorizedException('User ID not found');

    return this.tradeService.buy(body, userId);
  }

  @Post('sell')
  @UseGuards(JwtAuthGuard)
  sell(@Request() req, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new UnauthorizedException('User ID not found');

    return this.tradeService.sell(body, userId);
  }

  @Get('open')
  @UseGuards(JwtAuthGuard)
  getOpenTrades(@Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new UnauthorizedException('User ID not found');

    return this.tradeService.getOpenTrades(userId);
  }

  @Get('closed')
  @UseGuards(JwtAuthGuard)
  getClosedTrades(@Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new UnauthorizedException('User ID not found');

    return this.tradeService.getClosedTrades(userId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  getTradeHistory(@Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new UnauthorizedException('User ID not found');

    return this.tradeService.getTradeHistory(userId);
  }
}

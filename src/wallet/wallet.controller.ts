import { Controller, Post, Get, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  async deposit(
    @Request() req,
    @Body() body: { amount: number; crypto: string },
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new UnauthorizedException('User ID not found in token');

    return this.walletService.deposit({
      userId,
      amount: body.amount,
      crypto: body.crypto,
    });
  }
  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  async withdraw(
    @Request() req,
    @Body() body: { crypto: string; amount: number; address: string },
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new UnauthorizedException('User ID not found in token');

    return this.walletService.withdraw(userId, body);
  }


  @Get('balance')
  @UseGuards(JwtAuthGuard)
  async getBalance(@Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new UnauthorizedException('User ID not found in token');

    return this.walletService.getBalance(userId);
  }
}

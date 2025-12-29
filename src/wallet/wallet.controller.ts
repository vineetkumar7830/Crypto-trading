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
import { WalletService } from './wallet.service';


@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}
  
  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  deposit(@Request() req, @Body() body) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new UnauthorizedException();

    return this.walletService.deposit({
      userId,
      amount: body.amount,
      crypto: body.crypto,
    });
  }
  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  withdraw(@Request() req, @Body() body) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new UnauthorizedException();

    return this.walletService.withdraw(userId, body);
  }

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  getBalance(@Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new UnauthorizedException();

    return this.walletService.getBalance(userId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  getHistory(@Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new UnauthorizedException('User ID not found');
    
    return this.walletService.getWalletHistory(userId);
    
  }
}

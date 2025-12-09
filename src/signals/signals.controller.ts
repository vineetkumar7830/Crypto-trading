
import { Controller, Get, Post, Param, Request, UseGuards } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { AuthGuard } from '@nestjs/passport'; 

@Controller('signals')
export class SignalsController {
  constructor(private signalsService: SignalsService) {}

  @Get('latest')
  @UseGuards(JwtAuthGuard)
  getLatest(@Request() req: any) { 
    return this.signalsService.getLatest(req.user.userId);
  }
 
  @Post('subscribe/:signalId')
  @UseGuards(JwtAuthGuard)
  subscribe(@Param('signalId') signalId: string, @Request() req: any) { 
    return this.signalsService.subscribe(req.user.userId, signalId);
  }
}

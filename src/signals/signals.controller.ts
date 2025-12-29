import { Controller, Post, Body, Get } from '@nestjs/common';
import { SignalService } from './signals.service';
import { CreateSignalDto } from './dto/create-signal.dto';

@Controller('signals')
export class SignalController {
  constructor(private readonly signalService: SignalService) {}

  @Post('create')
  async createSignal(@Body() dto: CreateSignalDto) {
    const signal = await this.signalService.createSignal(dto);

    return {
      success: true,
      message: 'Trade opened successfully',
      result: {
        id: signal._id,
        asset: signal.asset,
        direction: signal.direction,
        entryPrice: signal.entryPrice,
        expiry: signal.expiry,
        status: 'RUNNING',
      },
    };
  }

  @Get()
  async getSignals() {
    const signals = await this.signalService.getAllSignals();

    return {
      success: true,
      total: signals.length,
      result: signals,
    };
  }
}

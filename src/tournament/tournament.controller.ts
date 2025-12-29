import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { TournamentService, DurationUnit } from './tournament.service';

interface CreateTournamentDto {
  name: string;
  entryAmount: number;
  duration: number;
  durationUnit: DurationUnit;
}

@Controller('api/v1/tournament')
export class TournamentController {
  constructor(private readonly service: TournamentService) {}

  @Post('create')
  async create(@Body() body: CreateTournamentDto) {
    return this.service.createTournament(body);
  }

  @Post('join/:tId/:uId')
  async join(@Param('uId') uId: string, @Param('tId') tId: string) {
    return this.service.joinTournament(uId, tId);
  }

  @Post('start/:id')
  async start(@Param('id') id: string) {
    return this.service.startTournament(id);
  }

  @Get('active')
  async getActiveTournament() {
    return this.service.getActive();
  }

  @Get('all')
  async getAllTournaments() {
    return this.service.getAllTournaments();
  }

  @Get('status/:id')
  async getStatus(@Param('id') id: string) {
    return this.service.getTournamentStatus(id);
  }
}

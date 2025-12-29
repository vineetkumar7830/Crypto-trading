import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/role.guard';
import { SocialService } from './social.service';

@Controller('social')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user', 'admin', 'affiliate')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('leaderboard')
  getLeaderboard(@Query('limit') limit = 100) {
    return this.socialService.getLeaderboard(Number(limit));
  }

  @Post('follow/:traderId')
  followTrader(@Param('traderId') traderId: string, @Request() req: any) {
    return this.socialService.follow(req.user.userId, traderId);
  }

  @Delete('unfollow/:traderId')
  unfollowTrader(@Param('traderId') traderId: string, @Request() req: any) {
    return this.socialService.unfollow(req.user.userId, traderId);
  }

  @Get('following/:userId')
  getFollowing(@Param('userId') userId: string) {
    return this.socialService.getFollowing(userId);
  }

  @Post('copy-settings/:userId')
  updateCopySettings(
    @Param('userId') userId: string,
    @Body() settings: any,
    @Request() req: any,
  ) {
    if (req.user.userId !== userId) {
      throw new UnauthorizedException();
    }

    return this.socialService.updateCopySettings(userId, settings);
  }

  @Get('feed/:userId')
  getFeed(@Param('userId') userId: string, @Request() req: any) {
    if (req.user.userId !== userId) {
      throw new UnauthorizedException();
    }

    return this.socialService.getSocialFeed(userId);
  }

  @Post('share-trade/:tradeId')
  shareTrade(
    @Request() req: any,
    @Param('tradeId') tradeId: string,
    @Body('message') message?: string,
  ) {
    return this.socialService.shareTrade(
      req.user.userId,
      tradeId,
      message,
    );
  }
}

import { Controller, Get, Post, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get('profile/:id')
  @UseGuards(JwtAuthGuard)
  getProfile(@Param('id') id: string) {
    return this.userService.getProfile(id);
  }

  @Patch('profile/:id')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Param('id') id: string, @Body() updateDto: UpdateProfileDto) {
    return this.userService.update(id, updateDto);
  }

  @Get('pnl/:id')
  @UseGuards(JwtAuthGuard)
  getPnL(@Param('id') id: string) {
    return this.userService.calculatePnL(id);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Trade } from '../trade/entities/trade.entity';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';
import CustomResponse from 'providers/custom-response.service';
import CustomError from 'providers/customer-error.service';

type TradeDocument = Trade & Document;

@Injectable()
export class AnalyticsService {
  constructor(@InjectModel(Trade.name) private tradeModel: Model<TradeDocument>) {}

  async create(createAnalyticsDto: CreateAnalyticsDto) {
    try {
      return new CustomResponse(200, 'Analytics created successfully', createAnalyticsDto);
    } catch (error) {
      console.error('Create Analytics Error:', error);
      return new CustomError(500, error.message || 'Failed to create analytics');
    }
  }

  async findAll() {
    try {
      return new CustomResponse(200, 'Analytics list fetched successfully', []);
    } catch (error) {
      console.error('Find All Analytics Error:', error);
      return new CustomError(500, error.message || 'Failed to fetch analytics list');
    }
  }

  async findOne(id: string) {
    try {
      if (!id) throw new NotFoundException('Analytics not found');
      return new CustomResponse(200, 'Analytics fetched successfully', { id });
    } catch (error) {
      console.error('Find One Analytics Error:', error);
      return new CustomError(404, error.message || 'Analytics not found');
    }
  }

  async update(id: string, updateAnalyticsDto: UpdateAnalyticsDto) {
    try {
      if (!id) throw new NotFoundException('Analytics not found');
      return new CustomResponse(200, 'Analytics updated successfully', { id, ...updateAnalyticsDto });
    } catch (error) {
      console.error('Update Analytics Error:', error);
      return new CustomError(500, error.message || 'Failed to update analytics');
    }
  }

  async remove(id: string) {
    try {
      if (!id) throw new NotFoundException('Analytics not found');
      return new CustomResponse(200, 'Analytics removed successfully', { id });
    } catch (error) {
      console.error('Remove Analytics Error:', error);
      return new CustomError(500, error.message || 'Failed to remove analytics');
    }
  }

  async getData(userId: string) {
    try {
      const pipeline = [
        { $match: { userId } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalPnL: { $sum: '$profitLoss' },
            volume: { $sum: { $multiply: ['$quantity', '$price'] } },
          },
        },
      ];
      const data = await this.tradeModel.aggregate(pipeline).exec();
      return new CustomResponse(200, 'Analytics data fetched successfully', {
        chartData: data,
        summary: { totalPnL: data.reduce((sum, d) => sum + d.totalPnL, 0) },
      });
    } catch (error) {
      console.error('Get Analytics Data Error:', error);
      return new CustomError(500, error.message || 'Failed to fetch analytics data');
    }
  }
}

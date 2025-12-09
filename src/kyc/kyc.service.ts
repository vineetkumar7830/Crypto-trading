import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Kyc } from './entities/kyc.entity';
import CustomResponse from 'providers/custom-response.service';
import CustomError from 'providers/customer-error.service';

@Injectable()
export class KycService {
  constructor(@InjectModel(Kyc.name) private kycModel: Model<Kyc>) {}

  async submit(userId: string, data: any) {
    try {
      const kyc = new this.kycModel({ userId, status: 'pending', docs: JSON.stringify(data) });
      await kyc.save();
      return new CustomResponse(200, 'KYC submitted successfully', kyc);
    } catch (error) {
      console.error('KYC Submit Error:', error);
      return new CustomError(500, error.message || 'Failed to submit KYC');
    }
  }
async approve (userId: string, data: { status: string; reason?: string})
  async approve(userId: string, data: { status: string; reason?: string }) {
    try {
      await this.kycModel.updateOne({ userId }, { status: data.status, reason: data.reason });
      return new CustomResponse(200, 'KYC status updated successfully', { userId, ...data });
    } catch (error) {
      console.error('KYC Approve Error:', error);
      return new CustomError(500, error.message || 'Failed to update KYC status');
    }
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import CustomResponse from 'providers/custom-response.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // ✅ Always generate unique affiliate code
  async generateUniqueAffiliateCode(): Promise<string> {
    let code: string = '';
    let exists = true;

    while (exists) {
      code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const result = await this.userModel.exists({ affiliateCode: code });
      exists = !!result;
    }

    return code;
  }

  async create(data: any): Promise<CustomResponse> {
    try {
      // ✅ Check duplicate email first
      const existingUser = await this.userModel.findOne({ email: data.email }).lean();
      if (existingUser) {
        return new CustomResponse(400, 'Email already exists', null);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      const affiliateCode = await this.generateUniqueAffiliateCode();

      const userPayload = {
        ...data,
        password: hashedPassword,
        affiliateCode,
      };

      const user = new this.userModel(userPayload);

      try {
        await user.save();
      } catch (err: any) {
        // ✅ Handle duplicate key errors safely
        if (err.code === 11000) {
          if (err.keyValue.email) return new CustomResponse(400, 'Email already exists', null);
          if (err.keyValue.affiliateCode) {
            user.affiliateCode = await this.generateUniqueAffiliateCode();
            await user.save();
          }
        } else {
          throw err;
        }
      }

      return new CustomResponse(201, 'User created successfully', user.toObject());
    } catch (error: any) {
      console.error('UserService CREATE Error:', error);
      return new CustomResponse(500, error.message || 'Internal server error', null);
    }
  }

  // ---------------------- FIND BY EMAIL ----------------------
  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).lean();
  }

  // ---------------------- FIND BY ID ----------------------
  async findById(id: string): Promise<CustomResponse> {
    if (!Types.ObjectId.isValid(id)) {
      return new CustomResponse(404, 'Invalid user id', null);
    }
    const user = await this.userModel.findById(id);
    return new CustomResponse(user ? 200 : 404, user ? 'User found' : 'User not found', user);
  }

  // ---------------------- UPDATE USER ----------------------
  async update(id: string, data: any): Promise<CustomResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return new CustomResponse(400, 'Invalid user id', null);
      }

      // ✅ Check duplicate email when updating
      if (data.email) {
        const existingUser = await this.userModel.findOne({ email: data.email }).lean();
        if (existingUser && (existingUser._id as Types.ObjectId).toString() !== id) {
          return new CustomResponse(400, 'Email already in use', null);
        }
      }

      const updatedUser = await this.userModel.findByIdAndUpdate(id, data, { new: true });
      if (!updatedUser) return new CustomResponse(404, 'User not found', null);

      return new CustomResponse(200, 'User updated successfully', updatedUser);
    } catch (error: any) {
      console.error('UserService UPDATE Error:', error);
      return new CustomResponse(500, error.message || 'Internal server error', null);
    }
  }

  async findByAffiliateCode(code: string): Promise<CustomResponse> {
    if (!code) return new CustomResponse(400, 'Affiliate code is required', null);
    const user = await this.userModel.findOne({ affiliateCode: code }).lean();
    return new CustomResponse(user ? 200 : 404, user ? 'User found' : 'User not found', user);
  }

  async findManyByIds(ids: string[]): Promise<CustomResponse> {
    const validIds = ids.filter(id => Types.ObjectId.isValid(id)).map(id => new Types.ObjectId(id));
    const users = await this.userModel.find({ _id: { $in: validIds } }).lean();
    return new CustomResponse(200, 'Users fetched successfully', users);
  }

  // ---------------------- GET PROFILE ----------------------
  async getProfile(id: string): Promise<CustomResponse> {
    return this.findById(id);
  }

  // ---------------------- CALCULATE PNL ----------------------
  async calculatePnL(userId: string): Promise<CustomResponse> {
    return new CustomResponse(200, 'PnL calculated', { userId, pnl: 0 });
  }
}

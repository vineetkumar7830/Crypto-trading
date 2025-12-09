import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { NotificationService } from '../notification/notification.service';
import CustomResponse from 'providers/custom-response.service';
import { throwException } from 'util/errorhandling';
import CustomError from 'providers/customer-error.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private notificationService: NotificationService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const existing = await this.userModel.findOne({ email: createUserDto.email }).exec();
      if (existing) throw new ConflictException('Email already exists');

      const hashed = await bcrypt.hash(createUserDto.password, 10);

      const generatedAffiliateCode = createUserDto.affiliateCode
        ? createUserDto.affiliateCode
        : Math.random().toString(36).slice(-8);

      const user = new this.userModel({
        ...createUserDto,
        password: hashed,
        affiliateCode: generatedAffiliateCode,
        balance: 0,
        totalPnL: 0,
        role: 'user',
      } as Partial<User>);

      if ((createUserDto as any).referralCode) {
        const parent = await this.userModel
          .findOne({ affiliateCode: (createUserDto as any).referralCode })
          .exec() as (User & { _id: Types.ObjectId }) | null;

        if (parent) {
          user.parentAffiliate = parent._id.toString();
          user.role = parent.role === 'affiliate' ? 'sub_affiliate' : 'user';
          user.commissionRate = user.role === 'sub_affiliate' ? 2 : 0;
        }
      }

      const saved = await user.save();
      await this.notificationService.sendEmail(String(saved._id), 'Welcome', 'Account created!');

      return new CustomResponse(201, 'User created successfully', saved);
    } catch (err: any) {
      throwException(err);
    }
  }

  async findByEmail(email: string) {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      return new CustomResponse(200, 'User fetched successfully', user);
    } catch (err) {
      throwException(err);
    }
  }

  async findByEmailUser(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid user id');

      const user = await this.userModel.findById(id).exec();
      if (!user) throw new NotFoundException('User not found');

      return new CustomResponse(200, 'User fetched successfully', user);
    } catch (err) {
      throwException(err);
    }
  }

  async update(id: string, updateDto: UpdateProfileDto | Partial<User>) {
    try {
      const updated = await this.userModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
      return new CustomResponse(200, 'Profile updated successfully', updated);
    } catch (err) {
      throwException(err);
    }
  }

  async getProfile(id: string) {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) throw new NotFoundException('User not found');

      user.totalPnL = await this.calculatePnL(id);
      return new CustomResponse(200, 'Profile fetched successfully', user);
    } catch (err) {
      throwException(err);
    }
  }

  async calculatePnL(userId: string): Promise<number> {
    return 0;
  }

  async submitKyc(userId: string, docs: { idProof: string; addressProof: string }) {
    try {
      await this.userModel.updateOne(
        { _id: userId },
        { kyc: { status: 'pending', docs: JSON.stringify(docs) } },
      ).exec();

      return new CustomResponse(200, 'KYC submitted successfully', { status: 'pending' });
    } catch (err) {
      throwException(err);
    }
  }

  async updateSocial(id: string, update: { followers?: string[]; following?: string[]; copySettings?: any; allowCopying?: boolean }) {
    try {
      const updated = await this.userModel.findByIdAndUpdate(id, { $set: update }, { new: true }).exec();
      return new CustomResponse(200, 'Social data updated successfully', updated);
    } catch (err) {
      throwException(err);
    }
  }

  async findByAffiliateCode(code: string) {
    try {
      const user = await this.userModel.findOne({ affiliateCode: code }).exec();
      return new CustomResponse(200, 'Affiliate user fetched successfully', user);
    } catch (err) {
      throwException(err);
    }
  }

  async findManyByIds(ids: (string | Types.ObjectId)[]) {
    try {
      const cleaned = ids.map(i => (typeof i === 'string' ? i : i.toString()));
      const users = await this.userModel.find({ _id: { $in: cleaned } }).exec();
      return new CustomResponse(200, 'Users fetched', users);
    } catch (err) {
      return new CustomError(500, (err as any).message || 'Failed to fetch users');
    }
  }
}

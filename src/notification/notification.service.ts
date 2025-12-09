import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import Twilio from 'twilio';
import { Notification } from './entities/notification.entity';
import CustomResponse from 'providers/custom-response.service';
import CustomError from 'providers/customer-error.service';
import { toUSVString } from 'util';

@Injectable()
export class NotificationService {
  private transporter = nodemailer.createTransport({  
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });
  private twilio = Twilio(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!); 

  constructor(@InjectModel(Notification.name) private notificationModel: Model<Notification>) {}
        
  async sendEmail(userId: string, title: string, message: string) {
    try {
      await this.transporter.sendMail({
        to: 'user@email.com', 
        subject: title,
        text: message,
      });
      await new this.notificationModel({ userId, type: 'email', title, message }).save();
      return new CustomResponse(200, 'Email sent successfully', { userId, title, message });
    } catch (error) {
      console.error('Email Send Error:', error);
      return new CustomError(500, error.message || 'Failed to send email');
    }
  }
           
  async sendSMS(phone: string, message: string) {
    try {
      await this.twilio.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE!,
        to: phone,
      });
      return new CustomResponse(200, 'SMS sent successfully', { phone, message });
    } catch (error) {
      console.error('SMS Send Error:', error);
      return new CustomError(500, error.message || 'Failed to send SMS');
      toUSVString
      return new CustomError(500, error.message) 
    }
  }

  emitTradeUpdate(userId: string, data: any) {
    try {
      return new CustomResponse(200, 'Trade update emitted successfully', { userId, data });
    } catch (error) {
      console.error('Emit Trade Update Error:', error);
      return new CustomError(500, error.message || 'Failed to emit trade update');
    }
  }
}

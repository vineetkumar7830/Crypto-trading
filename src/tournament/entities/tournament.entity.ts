import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TournamentDocument = Tournament & Document;

@Schema({ timestamps: true })
export class Tournament {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  entryAmount: number;

  @Prop({ required: true })
  duration: number; 

  @Prop({ required: true })
  durationUnit: 'seconds' | 'minutes' | 'hours' | 'days';

  @Prop()
  startTime: Date;

  @Prop()
  endTime: Date;

  @Prop({ default: 'upcoming' })
  status: 'upcoming' | 'running' | 'ended' | 'open'; 
}

export const TournamentSchema = SchemaFactory.createForClass(Tournament);

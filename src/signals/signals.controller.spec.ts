import { Test, TestingModule } from '@nestjs/testing';
import { SignalController } from './signals.controller';
import { SignalService } from './signals.service';

describe('SignalsController', () => {
  let controller: SignalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignalController],
      providers: [SignalService],
    }).compile();

    controller = module.get<SignalController>(SignalController);
  });
  
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

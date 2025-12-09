import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificationGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('join')
  handleJoin(@MessageBody() userId: string, client: Socket) {
    client.join(userId);
  }

  emitUpdate(userId: string, data: any) {
    this.server.to(userId).emit('update', data);
  }
}
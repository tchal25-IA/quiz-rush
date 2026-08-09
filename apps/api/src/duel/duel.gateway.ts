import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { DuelService } from './duel.service';
import type { AnswerKey } from '@quiz-rush/shared';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/duel',
})
export class DuelGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly duel: DuelService,
    private readonly jwt: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers.authorization?.replace('Bearer ', '') ?? '');
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('duel:queue')
  async queue(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { categoryId?: string },
  ) {
    const result = await this.duel.enqueue(client.data.userId, body?.categoryId);
    if (result.status === 'ready') {
      const room = `duel:${result.duelId}`;
      client.join(room);
      this.server.to(room).emit('duel:matched', result);
      // Also notify by user rooms if already joined
      this.server.emit('duel:matched', result);
    } else {
      client.join(`duel:${result.duelId}`);
      client.emit('duel:queued', result);

      setTimeout(async () => {
        const state = await this.duel.getDuel(result.duelId, client.data.userId).catch(() => null);
        if (state?.status === 'matching') {
          await this.duel.cancelMatchmaking(client.data.userId);
          client.emit('duel:timeout', { duelId: result.duelId });
        }
      }, result.timeoutMs);
    }
    return result;
  }

  @SubscribeMessage('duel:answer')
  async answer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { duelId: string; questionIndex: number; answer: AnswerKey },
  ) {
    const result = await this.duel.submitDuelAnswer(
      client.data.userId,
      body.duelId,
      body.questionIndex,
      body.answer,
    );
    this.server.to(`duel:${body.duelId}`).emit('duel:progress', {
      userId: client.data.userId,
      ...result,
    });
    if (result.finished) {
      this.server.to(`duel:${body.duelId}`).emit('duel:finished', result);
    }
    return result;
  }

  @SubscribeMessage('duel:cancel')
  async cancel(@ConnectedSocket() client: Socket) {
    return this.duel.cancelMatchmaking(client.data.userId);
  }
}

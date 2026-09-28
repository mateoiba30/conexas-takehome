import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly SALT_ROUNDS = 10;

  async hashPassword(password: string): Promise<string> {
    this.logger.debug('hashPassword: hashing');
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    this.logger.debug('comparePassword: comparing');
    return bcrypt.compare(plain, hash);
  }
}

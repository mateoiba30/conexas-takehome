import { Injectable, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from '../common/services/crypto.service';
import { IUsersRepository } from '../users/interfaces/users.repository.interface';
import { LoginDto } from './dto/login.dto';
import { randomQuote } from '../common/star-wars.quotes';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepo: IUsersRepository,
    private readonly crypto: CryptoService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    this.logger.debug({ email: dto.email }, 'AuthService.login: entry');

    const user = await this.usersRepo.findByEmail(dto.email);
    if (!user) {
      this.logger.warn({ email: dto.email }, 'AuthService.login: user not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.crypto.comparePassword(dto.password, user.password);
    if (!isValid) {
      this.logger.warn({ email: dto.email }, 'AuthService.login: invalid password');
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    this.logger.log({ userId: user.id, email: user.email, quote: randomQuote() }, 'AuthService.login: login successful');

    return { access_token };
  }
}

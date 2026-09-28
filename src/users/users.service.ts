import { Injectable, ConflictException, Inject, Logger } from '@nestjs/common';
import { CryptoService } from '../common/services/crypto.service';
import { IUsersRepository } from './interfaces/users.repository.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepo: IUsersRepository,
    private readonly crypto: CryptoService,
  ) {}

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    this.logger.debug({ email: dto.email }, 'UsersService.create: entry');

    const exists = await this.usersRepo.existsByEmail(dto.email);
    if (exists) {
      this.logger.warn({ email: dto.email }, 'UsersService.create: email already registered');
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await this.crypto.hashPassword(dto.password);
    const user = await this.usersRepo.create({
      name: dto.name,
      lastname: dto.lastname,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.REGULAR,
    });

    this.logger.log({ userId: user.id, email: user.email }, 'UsersService.create: user created');

    const { password, ...result } = user;
    return result;
  }
}

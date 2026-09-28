import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { IUsersRepository } from '../users/interfaces/users.repository.interface';
import { CryptoService } from '../common/services/crypto.service';
import { User, UserRole } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

const mockUser: User = {
  id: 1,
  name: 'Juan',
  lastname: 'Pérez',
  email: 'juan@example.com',
  password: 'hashedpassword',
  role: UserRole.REGULAR,
  created_at: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: jest.Mocked<IUsersRepository>;
  let crypto: jest.Mocked<CryptoService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    usersRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      existsByEmail: jest.fn(),
    };
    crypto = { hashPassword: jest.fn(), comparePassword: jest.fn() } as any;
    jwtService = { sign: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'IUsersRepository', useValue: usersRepo },
        { provide: CryptoService, useValue: crypto },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    const dto: LoginDto = { email: 'juan@example.com', password: 'SecurePass1' };

    it('returns an access_token when credentials are valid', async () => {
      usersRepo.findByEmail.mockResolvedValue(mockUser);
      crypto.comparePassword.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(dto);

      expect(result).toEqual({ access_token: 'jwt-token' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('throws UnauthorizedException when user is not found', async () => {
      usersRepo.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(crypto.comparePassword).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when password is incorrect', async () => {
      usersRepo.findByEmail.mockResolvedValue(mockUser);
      crypto.comparePassword.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});

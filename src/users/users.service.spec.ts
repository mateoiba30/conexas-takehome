import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { IUsersRepository } from './interfaces/users.repository.interface';
import { CryptoService } from '../common/services/crypto.service';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

const mockUser: User = {
  id: 1,
  name: 'Juan',
  lastname: 'Pérez',
  email: 'juan@example.com',
  password: 'hashedpassword',
  role: UserRole.REGULAR,
  created_at: new Date(),
};

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: jest.Mocked<IUsersRepository>;
  let crypto: jest.Mocked<CryptoService>;

  beforeEach(async () => {
    usersRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      existsByEmail: jest.fn(),
    };
    crypto = {
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: 'IUsersRepository', useValue: usersRepo },
        { provide: CryptoService, useValue: crypto },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    const dto: CreateUserDto = {
      name: 'Juan',
      lastname: 'Pérez',
      email: 'juan@example.com',
      password: 'SecurePass1',
    };

    it('creates a user and returns data without the password field', async () => {
      usersRepo.existsByEmail.mockResolvedValue(false);
      crypto.hashPassword.mockResolvedValue('hashedpassword');
      usersRepo.create.mockResolvedValue(mockUser);

      const result = await service.create(dto);

      expect(usersRepo.create).toHaveBeenCalledWith({
        name: dto.name,
        lastname: dto.lastname,
        email: dto.email,
        password: 'hashedpassword',
        role: UserRole.REGULAR,
      });
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(dto.email);
    });

    it('always sets role to REGULAR regardless of input shape', async () => {
      usersRepo.existsByEmail.mockResolvedValue(false);
      crypto.hashPassword.mockResolvedValue('hashedpassword');
      usersRepo.create.mockResolvedValue(mockUser);

      await service.create(dto);

      expect(usersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.REGULAR }),
      );
    });

    it('throws ConflictException when email is already registered', async () => {
      usersRepo.existsByEmail.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(usersRepo.create).not.toHaveBeenCalled();
    });
  });
});

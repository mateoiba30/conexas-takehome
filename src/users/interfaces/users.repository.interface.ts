import { User, UserRole } from '../entities/user.entity';

export interface CreateUserData {
  name: string;
  lastname: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface IUsersRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  existsByEmail(email: string): Promise<boolean>;
}

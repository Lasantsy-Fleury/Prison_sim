import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from './entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

export interface AuthResult {
  user: Omit<User, 'password'>;
  access_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email.toLowerCase(),
      password: hashed,
      name: dto.name ?? dto.email.split('@')[0],
    });
    await this.usersRepository.save(user);

    return this.buildResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const matches = await bcrypt.compare(dto.password, user.password);
    if (!matches) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    return this.buildResult(user);
  }

  async findById(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    const { password, ...safe } = user;
    return safe;
  }

  private buildResult(user: User): AuthResult {
    const { password, ...safe } = user;
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
    const payload = { sub: user.id, email: user.email, name: user.name };
    const access_token = this.jwtService.sign(payload, { expiresIn });
    return { user: safe, access_token };
  }
}

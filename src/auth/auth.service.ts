import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const existing = await this.usersService.findByEmail(createUserDto.email);
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }

    const hash = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.usersService.create({
      ...createUserDto,
      password: hash,
    });

    return this.login({ email: user.email, password: createUserDto.password });
  }

  async login(loginDto: LoginDto) {
    const cleanEmail = loginDto.email.trim().toLowerCase();
    console.log('📩 Cleaned email:', cleanEmail);

    const user = await this.usersService.findByEmail(cleanEmail);
    console.log('🔍 User found:', user);

    if (!user) throw new UnauthorizedException('Invalid credentials (email)');

    const match = await bcrypt.compare(loginDto.password, user.password);
    console.log('🔑 Password match:', match);

    if (!match) throw new UnauthorizedException('Invalid credentials (password)');

    const payload = { sub: user.id_user, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);
    
    // ✅ Return token AND user info
    return { 
      access_token: token,
      user: {
        id: user.id_user,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        avatar: user.avatar,
        phoneNumber: user.phoneNumber
      }
    };
  }

  // ✅ NEW: Get current user method
  ////async getCurrentUser(userId: number) {
   // const user = await this.usersService.findOne(userId);
    
    // Return user without password
    ////const { password, ...userWithoutPassword } = user;
    //return userWithoutPassword;
 // }

 async requestPasswordReset(email: string): Promise<{ message: string }> {
  const user = await this.usersService.findByEmail(email);
  if (!user) {
    throw new NotFoundException('Utilisateur introuvable');
  }

  const payload = { sub: user.id_user, email: user.email };
  const token = this.jwtService.sign(payload, {
    expiresIn: '15m', // validité du lien
  });

  // 👉 À ce stade, tu enverrais un e-mail contenant le lien de reset :
  const resetLink = `http://localhost:4200/reset-password?token=${token}`;
  console.log('✅ Reset link:', resetLink);

  // En prod : envoie par email
  return { message: 'Un lien de réinitialisation a été envoyé à votre email.' };
}

async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  try {
    const payload = this.jwtService.verify(token);
    const userId = payload.sub;

    await this.usersService.update(userId, { password: newPassword });

    return { message: 'Mot de passe réinitialisé avec succès.' };
  } catch (err) {
    throw new UnauthorizedException('Token invalide ou expiré');
  }
}

}
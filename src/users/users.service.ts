import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

 async create(userData: Partial<User>): Promise<User> {
  if (userData.password && !userData.password.startsWith('$2b$')) {
    userData.password = await bcrypt.hash(userData.password, 10);
  }

  const user = this.userRepository.create(userData);
  return await this.userRepository.save(user);
}

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id_user: id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
  const user = await this.userRepository.findOne({ where: { id_user: id } });
  if (!user) {
    throw new Error(`User with ID ${id} not found`);
  }

  // Mise à jour des champs simples
  user.firstname = updateData.firstname ?? user.firstname;
  user.lastname = updateData.lastname ?? user.lastname;
  user.email = updateData.email ?? user.email;
  user.phoneNumber = updateData.phoneNumber ?? user.phoneNumber;
  user.avatar = updateData.avatar ?? user.avatar;

  // Hachage du mot de passe si fourni et non vide
  if (updateData.password && updateData.password.trim() !== '') {
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(updateData.password.trim(), salt);
  }

  // Sauvegarde complète avec gestion de la logique
  return await this.userRepository.save(user);
}

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
  return this.userRepository.findOne({
    where: { email: email.trim().toLowerCase() },
  });
}

async updateRole(id: number, role: UserRole): Promise<User> {
  const user = await this.findOne(id);
  user.role = role;
  return this.userRepository.save(user);
}

 async updateAvatar(id: number, avatarUrl: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id_user: id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.avatar = avatarUrl;
    return this.userRepository.save(user);
  }
}

import bcrypt from "bcrypt";
import { Like } from "typeorm";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entities";
import { BaseService, PaginatedResult } from "./base.service";
import { PaginationQuery } from "../types/query.types";
import { NotFoundError, BusinessError } from "../utils/errors";

const SALT_ROUNDS = 10;

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export class UserService extends BaseService<User> {
  protected entityName = "User";

  constructor() {
    super(AppDataSource.getRepository(User));
  }

  async findPaginatedUsers(query: PaginationQuery): Promise<PaginatedResult<User>> {
    const where: any = {};

    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }

    return this.findPaginated(query, where, undefined, {
      tags: [`${this.entityName}:list`],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async createUser(data: CreateUserDto): Promise<User> {
    // Check email exists
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new BusinessError("Email already exists", "EMAIL_EXISTS");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await this.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role || UserRole.USER,
    });

    return user;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError(this.entityName, id);
    }

    // Check email uniqueness if changing
    if (data.email && data.email !== user.email) {
      const existing = await this.findByEmail(data.email);
      if (existing) {
        throw new BusinessError("Email already exists", "EMAIL_EXISTS");
      }
    }

    // Hash password if provided
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    const updated = await this.update(id, updateData);
    return updated!;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError(this.entityName, id);
    }

    // Prevent deleting the last admin
    if (user.role === UserRole.ADMIN) {
      const adminCount = await this.repository.count({ where: { role: UserRole.ADMIN } });
      if (adminCount <= 1) {
        throw new BusinessError("Cannot delete the last admin user", "LAST_ADMIN");
      }
    }

    return this.delete(id);
  }

  async toggleActive(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError(this.entityName, id);
    }

    // Prevent disabling the last admin
    if (user.role === UserRole.ADMIN && user.isActive) {
      const activeAdminCount = await this.repository.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });
      if (activeAdminCount <= 1) {
        throw new BusinessError("Cannot disable the last active admin", "LAST_ADMIN");
      }
    }

    const updated = await this.update(id, { isActive: !user.isActive });
    return updated!;
  }
}

export const userService = new UserService();

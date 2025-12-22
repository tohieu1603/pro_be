import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { AppDataSource } from "../data-source";
import { User, UserRole, RefreshToken } from "../entities";
import { NotFoundError, UnauthorizedError, BusinessError } from "../utils/errors";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret-key";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret-key";
const ACCESS_EXPIRES_SEC = 15 * 60; // 15 minutes in seconds
const REFRESH_EXPIRES_DAYS = 7;
const SALT_ROUNDS = 10;

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

  async register(email: string, password: string, name: string): Promise<User> {
    // Check email exists
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BusinessError("Email already registered", "EMAIL_EXISTS");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      name,
      role: UserRole.USER,
    });

    const saved = await this.userRepo.save(user);

    // Return without password
    const { password: _, ...userWithoutPassword } = saved;
    return userWithoutPassword as User;
  }

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user with password
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is disabled");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword as User, tokens };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Find refresh token in DB
    const tokenRecord = await this.refreshTokenRepo.findOne({
      where: { token: refreshToken },
      relations: ["user"],
    });

    if (!tokenRecord) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Check expiry
    if (new Date() > tokenRecord.expiresAt) {
      await this.refreshTokenRepo.remove(tokenRecord);
      throw new UnauthorizedError("Refresh token expired");
    }

    // Check user still active
    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedError("Account is disabled");
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(tokenRecord.user);

    return { accessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepo.delete({ token: refreshToken });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepo.delete({ userId });
  }

  async getMe(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User", userId);
    }
    return user;
  }

  validateAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedError("Invalid access token");
    }
  }

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_SEC });
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);

    // Generate refresh token
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

    // Save refresh token to DB
    const tokenEntity = this.refreshTokenRepo.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });
    await this.refreshTokenRepo.save(tokenEntity);

    return { accessToken, refreshToken };
  }

  // Create default admin if not exists
  async seedAdmin(): Promise<void> {
    const adminEmail = "admin@example.com";
    const existing = await this.userRepo.findOne({ where: { email: adminEmail } });

    if (!existing) {
      const hashedPassword = await bcrypt.hash("Admin@123", SALT_ROUNDS);
      const admin = this.userRepo.create({
        email: adminEmail,
        password: hashedPassword,
        name: "Administrator",
        role: UserRole.ADMIN,
      });
      await this.userRepo.save(admin);
      console.log("Default admin created: admin@example.com / Admin@123");
    }
  }
}

export const authService = new AuthService();

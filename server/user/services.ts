import { User } from '@prisma/client';
import { InsertUser } from 'lib/types';
import { prisma } from '../db';
class UserService {
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await prisma.user.findFirst({
        where: { email: username }, // Assuming username is email
      });
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: insertUser,
      });
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: String(id) },
      });
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }
}
export default new UserService();

import { prisma } from '../db';
import { Request, Response } from 'express';

// Example: Sync user after login
export async function syncUser(req: Request, res: Response) {
  try {
    console.log('Syncing user:', req.body);
    const { id, email } = req.body;
    if (!id || !email) {
      return res.status(400).json({ error: 'Missing user id or email' });
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { 
        id: id,
        email: email 
      }
    });
    
    let resultUser;
    if (!existingUser) {
      // Create user
      resultUser = await prisma.user.create({
        data: { 
          id, 
          email, 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }
      });
    } else {
      // Update user
      resultUser = await prisma.user.update({
        where: { id: id },
        data: { 
          email, 
          updatedAt: new Date() 
        }
      });
    }
    
    console.log('User synced:', resultUser);
    res.json(resultUser);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user', details: error });
  }
}

import { supabase } from '../db';
import { Request, Response } from 'express';

// Example: Sync user after login
export async function syncUser(req: Request, res: Response) {
  try {
    const { id, email } = req.body;
    if (!id || !email) {
      return res.status(400).json({ error: 'Missing user id or email' });
    }
    // Check if user exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('id', id)
      .single();
    if (selectError && selectError.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Error checking user', details: selectError.message });
    }
    let resultUser;
    if (!existingUser) {
      // Create user
      const { data: createdUser, error: insertError } = await supabase
        .from('users')
        .insert({ id, email, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .select()
        .single();
      if (insertError) {
        return res.status(500).json({ error: 'Error creating user', details: insertError.message });
      }
      resultUser = createdUser;
    } else {
      // Update user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ email, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (updateError) {
        return res.status(500).json({ error: 'Error updating user', details: updateError.message });
      }
      resultUser = updatedUser;
    }
    res.json(resultUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync user', details: error });
  }
}

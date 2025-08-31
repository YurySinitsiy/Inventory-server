import prisma from '../lib/prismaClient.js';
import { supabase } from '../lib/supabaseClient.js';

const checkUserProfile = async (userId) => {
  const profile = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { status: true, role: true },
  });

  if (!profile) {
    const err = new Error('User not found');
    err.status = 401; // неавторизованный
    throw err;
  }

  if (profile.status === 'blocked') {
    const err = new Error('User blocked');
    err.status = 403; // доступ запрещён
    throw err;
  }

  return profile;
};

const checkToken = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    const err = new Error('No token provided');
    err.status = 401;
    throw err;
  }
  return token;
};

const checkUser = async (token) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    const err = new Error('Invalid token');
    err.status = 401;
    throw err;
  }
  return user;
};

export { checkUserProfile, checkToken, checkUser };

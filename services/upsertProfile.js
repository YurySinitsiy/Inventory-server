import prisma from '../lib/prismaClient.js';

const upsertProfile = async (userId, data) => {
  let profile = await prisma.profiles.findUnique({
    where: { id: userId },
  });
  if (!profile) {
    const { name, surname, email } = data;
    profile = await prisma.profiles.create({
      data: {
        id: userId,
        name,
        surname,
        email,
        role: 'user',
        status: 'unblocked',
      },
    });
  }
  return profile;
};

export default upsertProfile;

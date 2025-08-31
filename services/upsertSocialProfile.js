import prisma from '../lib/prismaClient.js';

const upsertSocialProfile = async (user) => {
  const [name, ...surnameParts] = (
    user.user_metadata?.full_name ||
    user.user_metadata?.user_name ||
    'User'
  ).split(' ');
  const surname = surnameParts.join(' ');
  const { email, id } = user;
  console.log(name, surname);
  const profile = await prisma.profiles.upsert({
    where: { id },
    update: { name, surname, email },
    create: {
      id,
      name,
      surname,
      email,
      role: 'user',
      status: 'unblocked',
    },
  });

  return profile;
};

export default upsertSocialProfile;

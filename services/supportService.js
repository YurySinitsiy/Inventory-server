import { Dropbox } from 'dropbox';
import prisma from '../lib/prismaClient.js';

export class SupportService {
  static async sendMessage(user, data) {
    const fullData = {
      userId: user.id,
      userEmail: user.email,
      ...data,
      adminsEmail: await this.getAdminsEmail(),
    };
    const fileName = `/support-${Date.now()}.json`;
    const dataToSend = JSON.stringify(fullData, null, 2);
    await this.uploadToDropbox(fileName, dataToSend);
  }

  static async getAdminsEmail() {
    const admins = await prisma.profiles.findMany({
      where: { role: 'admin' },
      select: { email: true },
    });
    return admins.map((a) => a.email);
  }

  static dropbox = new Dropbox({
    clientId: process.env.DROPBOX_APP_KEY,
    clientSecret: process.env.DROPBOX_APP_SECRET,
    refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
    fetch,
  });

  static async uploadToDropbox(path, dataToSend) {
    await this.dropbox.filesUpload({
      path,
      contents: dataToSend,
      mode: 'overwrite',
      mute: true,
    });
  }
}

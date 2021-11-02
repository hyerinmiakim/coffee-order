import { NextApiResponse } from 'next';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';

export const getUserId = async (res: NextApiResponse, token: string): Promise<string | void> => {
  let userId = '';

  try {
    const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
    userId = decodedIdToken.uid;
    return userId;
  } catch (err) {
    return res.status(400).end();
  }
};

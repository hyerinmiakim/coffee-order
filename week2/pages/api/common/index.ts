import FirebaseAdmin from '@/models/commons/firebase_admin.model';

export const authentication = async (token: string | undefined): Promise<string | null> => {
  if (token === undefined) {
    return null;
  }
  let userId = '';
  try {
    const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
    userId = decodedIdToken.uid;
  } catch (err) {
    return null;
  }
  return userId;
};

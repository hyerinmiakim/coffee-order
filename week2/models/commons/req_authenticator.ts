import { NextApiRequest } from 'next';
import { auth } from 'firebase-admin';
import debug from '@/utils/debug_log';
import FirebaseAdmin from './firebase_admin.model';

const log = debug('masa:models:req_authenticator');

interface AuthenticationResultOk {
  result: true;
  data: auth.DecodedIdToken;
}
interface AuthenticationResultFailed {
  result: false;
  errorMessage: string;
}

/**
 * HTTP 헤더에서 인증 토큰을 추출하여 검증한다.
 * @param headers HTTP 헤더 객체
 * @returns 검증 결과
 */
async function authenticate(
  headers: NextApiRequest['headers'],
): Promise<AuthenticationResultOk | AuthenticationResultFailed> {
  // 요청 헤더에서 토큰을 추출
  const token = headers.authorization;
  if (token === undefined) {
    return {
      result: false,
      errorMessage: 'no token',
    };
  }
  log(`token: ${token}`);

  // 토큰을 검증
  try {
    const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
    return { result: true, data: decodedIdToken };
  } catch (err) {
    return { result: false, errorMessage: 'invalid token' };
  }
}

export default authenticate;

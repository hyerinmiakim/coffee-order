import { IFindEventReq } from '@/controllers/event/interface/IFindEventReq';
import { IUpdateEventReq } from '@/controllers/event/interface/IUpdateEventReq';
import { JSCFindEvent } from '@/controllers/event/jsc/JSCFindEvent';
import { JSCUpdateEvent } from '@/controllers/event/jsc/JSCUpdateEvent';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import validateParamWithData from '@/models/commons/req_validator';
import { IEvent } from '@/models/interface/IEvent';
import { JSONSchema6 } from 'json-schema';
import { NextApiRequest, NextApiResponse } from 'next';
import { Interface } from 'readline';
import debug from '../../../../utils/debug_log';

const log = debug('masa:api:events:[eventId]:index');

function validateMethod(method: string | undefined): boolean {
  const supportMethod = ['PUT', 'GET'];
  return supportMethod.indexOf(method!) !== -1;
}

function validateToken(token: string | undefined): boolean {
  if (typeof token === 'undefined') return false;
  return true;
}

function getErrorMessage(res: NextApiResponse, code: number, param: any): any {
  const paramType = typeof param;
  const resStatus = res.status(code);
  if (paramType === 'string') return resStatus.end(param!);
  return resStatus.json(param);
}

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method, query } = req;
  log(method);

  if (!validateMethod(method)) {
    return getErrorMessage(res, 400, '');
  }

  if (method === 'GET') {
    // 검증
    const validateReq = validateParamWithData<IFindEventReq>(
      {
        params: req.query as any,
      },
      JSCFindEvent,
    );

    if (validateReq.result === false) {
      return getErrorMessage(res, 400, { text: validateReq.errorMessage });
    }

    log(`validateReq.result: ${validateReq.result}`);

    // 데이터 조작(READ)
    const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(validateReq.data.params.eventId);
    const doc = await ref.get();

    // 문서가 존재하지않는가?
    if (doc.exists === false) {
      return getErrorMessage(res, 404, 'Not found document');
    }
    const returnValue = {
      ...doc.data(),
      id: validateReq.data.params.eventId,
    };
    res.json(returnValue);
  }

  // PUT 메서드 처리
  if (method === 'PUT') {
    // 코드 복사 후 IUpdateEventReq, JSCUpdateEvent 2가지는 import 시켜야합니다.
    let userId = '';
    const token = req.headers.authorization;
    const FirebaseAdminInstance = FirebaseAdmin.getInstance();

    try {
      if (!validateToken(token)) throw new Error('Invalid Token Error');
      const decodedIdToken = await FirebaseAdminInstance.Auth.verifyIdToken(token!);
      userId = decodedIdToken.uid;
    } catch (err) {
      console.error(err);
      return getErrorMessage(res, 400, 'token error');
    }

    const validateReq = validateParamWithData<IUpdateEventReq>(
      {
        params: req.query as any,
        body: req.body,
      },
      JSCUpdateEvent,
    );
    log(req.body);
    if (validateReq.result === false) {
      return getErrorMessage(res, 400, {
        text: validateReq.errorMessage,
      });
    }
    const ref = FirebaseAdminInstance.Firestore.collection('events').doc(validateReq.data.params.eventId);
    const doc = await ref.get();
    // 문서가 존재하지않는가?
    if (doc.exists === false) {
      getErrorMessage(res, 404, '');
    }

    const eventInfo = doc.data() as IEvent; // doc.data() 결과를 IEvent 인터페이스로 캐스팅
    if (eventInfo.ownerId !== userId) {
      return getErrorMessage(res, 401, { text: '이벤트 수정 권한이 없습니다' });
    }

    // eventInfo.closed = validateReq.data.body.closed ?? false;
    // 업데이트할 값
    const updateData = {
      ...eventInfo,
      ...validateReq.data.body,
    };
    // 문서에 변경할 값을 넣어줍니다.
    await ref.update(updateData);
    res.json(updateData);
  }
}

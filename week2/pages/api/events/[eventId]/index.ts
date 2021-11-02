import { IFindEventReq } from '@/controllers/event/interface/IFindEventReq';
import { IUpdateEventReq } from '@/controllers/event/interface/IUpdateEventReq';
import { JSCFindEvent } from '@/controllers/event/jsc/JSCFindEvent';
import { JSCUpdateEvent } from '@/controllers/event/jsc/JSCUpdateEvent';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import validateParamWithData from '@/models/commons/req_validator';
import { IEvent } from '@/models/interface/IEvent';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../../utils/debug_log';

const log = debug('masa:api:events:[eventId]:index');

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);

  const supportMethod = ['PUT', 'GET'];
  if (supportMethod.indexOf(method!) === -1) {
    return res.status(400).end();
  }

  if (method === 'GET') {
    const validateReq = getValidatReq(req, res);
    log(`validateReq.result: ${validateReq.result}`);
    const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(validateReq.data.params.eventId);
    const doc = await ref.get();
    // 문서가 존재하지않는가?
    if (doc.exists === false) {
      res.status(404).end();
      return;
    }
    const returnValue = {
      ...doc.data(),
      id: validateReq.data.params.eventId,
    };
    res.json(returnValue);
  }
  // PUT 메서드 처리
  if (method === 'PUT') {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(400).end();
    }
    let userId = '';
    try {
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      userId = decodedIdToken.uid;
    } catch (err) {
      return res.status(400).end();
    }

    const validateReq = getValidatReq(req, res);
    const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(validateReq.data.params.eventId);
    const doc = await ref.get();
    // 문서가 존재하지않는가?
    if (doc.exists === false) {
      res.status(404).end();
      return;
    }
    const eventInfo = doc.data() as IEvent; // doc.data() 결과를 IEvent 인터페이스로 캐스팅
    if (eventInfo.ownerId !== userId) {
      return res.status(401).json({
        text: '이벤트 수정 권한이 없습니다',
      });
    }
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

function getValidatReq(req: NextApiRequest, res: NextApiResponse): any {
  const validateReq = validateParamWithData<IFindEventReq>(
    {
      params: req.query as any,
      body: req.body,
    },
    JSCFindEvent,
  );

  if (validateReq.result === false) {
    return res.status(400).json({
      text: validateReq.errorMessage,
    });
  }
  return validateReq;
}

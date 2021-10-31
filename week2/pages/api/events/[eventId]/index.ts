import { IAddEventReq } from '@/controllers/event/interface/IAddEventReq';
import { IFindEventReq } from '@/controllers/event/interface/IFindEventReq';
import { IUpdateEventReq } from '@/controllers/event/interface/IUpdateEventReq';
import { JSCAddEvent } from '@/controllers/event/jsc/JSCAddEvent';
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
    return res.status(400).end('Denined Method');
  }
  const validate = <T>(attributes: any, EventType: any): { result: boolean; data: T; errorMessage?: string } | void => {
    const validateReq = validateParamWithData<T>(attributes, EventType);
    if (validateReq.result === false) {
      return res.status(400).json({
        text: validateReq.errorMessage,
      });
    }
    return validateReq;
  };
  const getDoc = async (docName: string): Promise<any> => {
    const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(docName);
    const doc = await ref.get();
    if (doc.exists === false) throw new Error('해당 문서가 없습니다.');
    return { ref, doc };
  };

  if (method === 'GET') {
    const attributes = { params: req.query as any };
    const validateReq = validate<IFindEventReq>(attributes, JSCFindEvent);
    if (validateReq) {
      log(`validateReq.result: ${validateReq.result}`);
      try {
        const { doc } = await getDoc(validateReq.data.params.eventId);
        const returnValue = {
          ...doc.data(),
          id: validateReq.data.params.eventId,
        };
        res.json(returnValue);
      } catch (err: any) {
        return res.status(404).end(err.message);
      }
    }
  }

  if (method === 'PUT') {
    const token = req.headers.authorization;
    if (token === undefined) return res.status(400).end();

    let userId = '';
    try {
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      userId = decodedIdToken.uid;
    } catch (err) {
      return res.status(400).end('이상한 토큰');
    }
    const attributes = {
      params: req.query as any,
      body: req.body,
    };
    const validateReq = validate<IUpdateEventReq>(attributes, JSCUpdateEvent);
    if (validateReq) {
      log(req.body);
      try {
        const { ref, doc } = await getDoc(validateReq.data.params.eventId);
        const eventInfo = doc.data() as IEvent; // doc.data() 결과를 IEvent 인터페이스로 캐스팅
        if (eventInfo.ownerId !== userId) {
          return res.status(401).json({
            text: '이벤트 수정 권한이 없습니다',
          });
        }
        const updateData = {
          ...eventInfo,
          ...validateReq.data.body,
        };
        await ref.update(updateData);
        res.json(updateData);
      } catch (err: any) {
        return res.status(404).end(err.message);
      }
    }
  }
}

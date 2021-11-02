/* eslint-disable prettier/prettier */
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

function validateReq(method: string, req: NextApiRequest):any {
  let reqParam;
  if (method === 'GET') {
    reqParam = validateParamWithData<IFindEventReq>(
      {
        params: req.query as any,
      },
      JSCFindEvent,
    );
  }
  if (method === 'PUT') {
    reqParam = validateParamWithData<IUpdateEventReq>(
      {
        params: req.query as any,
        body: req.body,
      },
      JSCUpdateEvent,
    );
  }
  if (method === 'POST') {
    reqParam = validateParamWithData<IAddEventReq>(
      {
        body: req.body,
      },
      JSCAddEvent,
    );
  }

  log(`validateReq.result: ${(reqParam as any).result}`);
  return reqParam;
}

async function getDocumentRef(collectionPath: string, docPath: string) {
  const ref = FirebaseAdmin.getInstance().Firestore.collection(collectionPath).doc(docPath);
  const doc = await FirebaseAdmin.getInstance().Firestore.collection(collectionPath).doc(docPath).get();
  
  return {ref, doc};
}

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);

  const supportMethod = ['PUT', 'GET'];
  if (supportMethod.indexOf(method!) === -1) {
    return res.status(400).end();
  }
  
  const reqData = validateReq(method!, req);
  if (method === 'GET') {
    if ((reqData as any).result === false) {
      return res.status(400).json({
        text: (reqData as any).errorMessage,
      });
    }
    const eventID = (reqData as any).data.params.eventId;
    const {doc} = await getDocumentRef('events', eventID);
    
    // 문서가 존재하지않는가?
    if (doc.exists === false) {
      res.status(404).end();
      return;
    }
    const returnValue = {
      ...doc.data(),
      id: eventID,
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
    if ((reqData as any).result === false) {
      return res.status(400).json({
        text: (reqData as any).errorMessage,
      });
    }
    log(req.body);
    const {ref, doc} = await getDocumentRef('events', (reqData as any).data.params.eventId);
    // 문서가 존재하지않는가?
    if (doc.exists === false) {
      res.status(404).end();
    }
    const eventInfo = doc.data() as IEvent; // doc.data() 결과를 IEvent 인터페이스로 캐스팅
    if (eventInfo.ownerId !== userId) {
      return res.status(401).json({
        text: '이벤트 수정 권한이 없습니다',
      });
    }
    // 업데이트할 값
    const reqBody = (reqData as any).body;
    const updateData = {
      ...eventInfo,
      ...reqBody,
    };
    // 문서에 변경할 값을 넣어줍니다.
    await ref.update(updateData);
    res.json(updateData);
  }
}

export {validateReq};
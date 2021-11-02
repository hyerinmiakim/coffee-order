import { IFindEventReq } from '@/controllers/event/interface/IFindEventReq';
import { IUpdateEventReq } from '@/controllers/event/interface/IUpdateEventReq';
import { JSCFindEvent } from '@/controllers/event/jsc/JSCFindEvent';
import { JSCUpdateEvent } from '@/controllers/event/jsc/JSCUpdateEvent';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import validateParamWithData from '@/models/commons/req_validator';
import { IEvent } from '@/models/interface/IEvent';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../../utils/debug_log';
import { authentication } from '../../common';

const log = debug('masa:api:events:[eventId]:index');

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);
  switch (method) {
    case 'GET':
      getEvents(req, res);
      break;
    case 'PUT':
      putEvents(req, res);
      break;
    default:
      return res.status(400).end();
  }
}

const getEvents = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const validateReq = validateParamWithData<IFindEventReq>(
    {
      params: req.query as any,
    },
    JSCFindEvent,
  );
  if (validateReq.result === false) {
    return res.status(400).json({
      text: validateReq.errorMessage,
    });
  }

  log(`validateReq.result: ${validateReq.result}`);

  const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(validateReq.data.params.eventId);
  const doc = await ref.get();

  if (doc.exists === false) {
    res.status(404).end('문서가 없어요.');
    return;
  }

  const returnValue = {
    ...doc.data(),
    id: validateReq.data.params.eventId,
  };
  res.json(returnValue);
};

const putEvents = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const token = req.headers.authorization;
  const userId = await authentication(token);
  if (!userId) {
    return res.status(400).end();
  }
  const validateReq = validateParamWithData<IUpdateEventReq>(
    {
      params: req.query as any,
      body: req.body,
    },
    JSCUpdateEvent,
  );
  if (validateReq.result === false) {
    return res.status(400).json({
      text: validateReq.errorMessage,
    });
  }
  const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(validateReq.data.params.eventId);
  const doc = await ref.get();
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

  const updateData = {
    ...eventInfo,
    ...validateReq.data.body,
  };
  // 문서에 변경할 값을 넣어줍니다.
  await ref.update(updateData);
  res.json(updateData);
};

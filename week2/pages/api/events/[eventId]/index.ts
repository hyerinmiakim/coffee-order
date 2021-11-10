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

  //반환값 변수명 선언
  let returnValue;

  // method에 따라 다른 validateReq값을 반환하는 함수
  const getValidateReq = () =>
    method === 'GET'
      ? validateParamWithData<IFindEventReq>(
          {
            params: req.query as any,
          },
          JSCFindEvent,
        )
      : validateParamWithData<IUpdateEventReq>(
          {
            params: req.query as any,
            body: req.body,
          },
          JSCUpdateEvent,
        );

  //PUT method의 경우 토큰값을 검사하는 함수 (인증, 인가)
  const validateToken = async (eventInfo: IEvent) => {
    let userId;
    const token = req.headers.authorization;
    if (token === undefined) return res.status(400).end();
    try {
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      userId = decodedIdToken.uid;
    } catch (err) {
      return res.status(400).end('이상한 토큰');
    }
    if (eventInfo.ownerId !== userId) {
      return res.status(401).json({
        text: '이벤트 수정 권한이 없습니다.',
      });
    }
  };

  const validateReq = getValidateReq();

  if (validateReq.result === false) {
    return res.status(400).json({
      text: validateReq.errorMessage,
    });
  }

  const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(validateReq.data.params.eventId);
  const doc = await ref.get();
  if (doc.exists === false) {
    res.status(404).end('문서가 없어요');
  }

  if (method === 'PUT') {
    const eventInfo = doc.data() as IEvent;
    validateToken(eventInfo);
    //method가 PUT일 경우의 반환값
    returnValue = {
      ...eventInfo,
      ...validateReq.data.body,
    };
    await ref.update(returnValue);
  } else {
    //method가 GET일 경우의 반환값
    returnValue = {
      ...doc.data(),
      id: validateReq.data.params.eventId,
    };
  }

  res.json(returnValue);
}

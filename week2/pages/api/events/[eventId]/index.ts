import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { IFindEventReq } from '@/controllers/event/interface/IFindEventReq';
import { IUpdateEventReq } from '@/controllers/event/interface/IUpdateEventReq';
import { JSCFindEvent } from '@/controllers/event/jsc/JSCFindEvent';
import { JSCUpdateEvent } from '@/controllers/event/jsc/JSCUpdateEvent';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import validateParamWithData from '@/models/commons/req_validator';
import { IEvent } from '@/models/interface/IEvent';
import debug from '../../../../utils/debug_log';
import { JSCAddEvent } from '@/controllers/event/jsc/JSCAddEvent';
import { IAddEventReq } from '@/controllers/event/interface/IAddEventReq';

const log = debug('masa:api:events:[eventId]:index');
const BASE_PATH = '/api/events';

type AuthNextApiHander = (req: NextApiRequest, res: NextApiResponse, userId: string) => void | Promise<void>;

const withAuthorization =
  (db: FirebaseAdmin) =>
  (handler: AuthNextApiHander): NextApiHandler =>
  async (req, res) => {
    const token = req.headers.authorization;

    if (token === undefined) {
      return res.status(400).end('token?');
    }

    try {
      const decodedIdToken = await db.Auth.verifyIdToken(token);
      await handler(req, res, decodedIdToken.uid);
    } catch (err) {
      return res.status(400).end('이상한 토큰');
    }
  };

const handler = nc<NextApiRequest, NextApiResponse>({
  onNoMatch(_, res) {
    res.status(400).end();
  },
})
  .use(function validateParams(req, res, next) {
    let validateReq;

    switch (req.method) {
      case 'POST':
        validateReq = validateParamWithData<IAddEventReq>(
          {
            body: req.body,
          },
          JSCAddEvent,
        );
        break;
      case 'PUT':
        validateReq = validateParamWithData<IUpdateEventReq>(
          {
            params: req.query as any,
            body: req.body,
          },
          JSCUpdateEvent,
        );
        break;
      default:
        validateReq = validateParamWithData<IFindEventReq>(
          {
            params: req.query as any,
          },
          JSCFindEvent,
        );
        break;
    }

    log(`validateReq.result: ${validateReq.result}`);

    if (validateReq.result === false) {
      res.status(400).json({
        text: validateReq.errorMessage,
      });
    } else {
      next();
    }
  })
  .get(`${BASE_PATH}/:eventId`, async function (req, res) {
    const eventId = req.query.eventId as string;
    const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(eventId);
    const doc = await ref.get();
    // 문서가 존재하지않는가?
    if (doc.exists === false) {
      res.status(404).end('문서가 없어요');
      return;
    }
    const returnValue = {
      ...doc.data(),
      id: eventId,
    };
    res.json(returnValue);
  })
  .put(
    `${BASE_PATH}/:eventId`,
    withAuthorization(FirebaseAdmin.getInstance())(async function (req, res, userId) {
      const eventId = req.query.eventId as string;
      const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(eventId);
      const doc = await ref.get();
      // 문서가 존재하지않는가?
      if (doc.exists === false) {
        res.status(404).end();
      }

      const eventInfo = doc.data() as IEvent; // doc.data() 결과를 IEvent 인터페이스로 캐스팅

      log(eventInfo);
      if (eventInfo.ownerId !== userId) {
        return res.status(401).json({
          text: '이벤트 수정 권한이 없습니다',
        });
      }

      // eventInfo.closed = validateReq.data.body.closed ?? false;
      // 업데이트할 값
      const updateData = {
        ...eventInfo,
        ...req.body,
      };
      // 문서에 변경할 값을 넣어줍니다.
      await ref.update(updateData);
      res.json(updateData);
    }),
  )
  .post(`${BASE_PATH}`, async function (req, res) {
    const {
      title,
      desc,
      owner: { uid, displayName },
      lastOrder,
    } = req.body;
    const addData: Omit<IEvent, 'id'> = {
      title,
      desc: desc ?? '',
      ownerId: uid,
      ownerName: displayName ?? '',
      closed: false,
    };
    if (lastOrder !== undefined) {
      addData.lastOrder = lastOrder;
    }
    const result = await FirebaseAdmin.getInstance().Firestore.collection('events').add(addData);
    const returnValue = {
      ...addData,
      id: result.id,
    };
    res.json(returnValue);
  });

export default handler;

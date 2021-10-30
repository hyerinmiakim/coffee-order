import { IAddEventReq } from '@/controllers/event/interface/IAddEventReq';
import { JSCAddEvent } from '@/controllers/event/jsc/JSCAddEvent';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import validateParamWithData from '@/models/commons/req_validator';
import { IEvent } from '@/models/interface/IEvent';
import { auth } from 'firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../utils/debug_log';

const log = debug('masa:api:events:index');

/** 이벤트 root */
export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);

  const supportMethod = ['POST'];
  if (supportMethod.indexOf(method!) === -1) {
    return res.status(400).end();
  }

  // 2번
  if ((method === 'POST') === false) {
    return res.status(400).end();
  }

  const token = req.headers.authorization;
  if (token === undefined) {
    return res.status(400).end();
  }
  let userInfo: auth.DecodedIdToken | null = null;
  try {
    userInfo = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
  } catch (err) {
    return res.status(400).end();
  }

  const validateReq = validateParamWithData<IAddEventReq>(
    {
      body : req.body
    },
    JSCAddEvent,
  );

  if (validateReq.result === false) {
    return res.status(400).json({
      text: validateReq.errorMessage,
    });
  }

  const {
    title,
    desc,
    owner: { uid, displayName },
    lastOrder,
  } = validateReq.data.body;

  if (userInfo !== null && userInfo.uid !== uid) {
    return res.status(400).end(); //uid validation
  }

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
}

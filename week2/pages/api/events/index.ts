import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import { IEvent } from '@/models/interface/IEvent';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../utils/debug_log';
import { Methods } from './[eventId]';
import { checkValidation, checkAuthority } from './[eventId]/checkRequest';

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

  const uId = await checkAuthority(req,res);
  /*
    QUESTION: 이벤트 생성일 때도, 사용자 ID 기준으로 사용자 권한 체크를 하는 것으로 보여서 수정했습니다.
              이렇게 해도 될까요? 
  */
  const validateReq = checkValidation(req,res,Methods.POST)

  const {
    title,
    desc,
    owner: { uid, displayName },
    lastOrder,
  } = validateReq.data.body;

  if (uId !== null && uId !== uid) {
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

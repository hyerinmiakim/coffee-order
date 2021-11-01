/* eslint-disable prettier/prettier */

// import { IAddEventReq } from '@/controllers/event/interface/IAddEventReq';
// import { JSCAddEvent } from '@/controllers/event/jsc/JSCAddEvent';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
// import validateParamWithData from '@/models/commons/req_validator';
import { IEvent } from '@/models/interface/IEvent';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../utils/debug_log';
import {validateReqData, checkUserToken} from './[eventId]/index';

const log = debug('masa:api:events:index');

/** 이벤트 root */
export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);

  // Authorization
  checkUserToken(req,res);

  //Ajv validator
  const validateReq=validateReqData(method!, req, res);

  // 이벤트 생성
  const {
    title,
    desc,
    owner: { uid, displayName },
    lastOrder,
  } = validateReq.data.body;
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

  // 결과 반환
  const returnValue = {
    ...addData,
    id: result.id,
  };
  res.json(returnValue);
}
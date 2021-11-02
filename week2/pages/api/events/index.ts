/* eslint-disable prettier/prettier */
//import { IAddEventReq } from '@/controllers/event/interface/IAddEventReq';
//import { JSCAddEvent } from '@/controllers/event/jsc/JSCAddEvent';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
//import validateParamWithData from '@/models/commons/req_validator';
import { IEvent } from '@/models/interface/IEvent';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../utils/debug_log';
import {validateReq} from './[eventId]'

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
  
  const reqData = validateReq('POST', req);

  // POST 메서드 처리
  if (method === 'POST') {
    if ((reqData as any).result === false) {
      return res.status(400).json({
        text: (reqData as any).errorMessage,
      });
    }
    log(req.body);
    const {
      title,
      desc,
      owner: { uid, displayName },
      lastOrder,
    } = (reqData as any).data.body;
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
}

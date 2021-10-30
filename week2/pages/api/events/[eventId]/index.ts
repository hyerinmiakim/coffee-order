import { IFindEventReq } from '@/controllers/event/interface/IFindEventReq';
import { JSCFindEvent } from '@/controllers/event/jsc/JSCFindEvent';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import validateParamWithData from '@/models/commons/req_validator';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../../utils/debug_log';

const log = debug('masa:api:events:[eventId]:index');

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);
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
  log(req.query)
  log(validateReq.data)

  const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(validateReq.data.params.eventId);
  const doc = await ref.get();
  // 문서가 존재하지않는가?
  if (doc.exists === false) {
    res.status(404).end('Not Found Document');
    return;
  }

  const returnValue = {
    ...doc.data(),
    id: validateReq.data.params.eventId,
  };
  res.json(returnValue);

}

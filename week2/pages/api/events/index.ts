import { IAddOrderReq } from '@/controllers/event/interface/IAddOrderReq';
import { JSCAddOrder } from '@/controllers/event/jsc/JSCAddOrder';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import validateParamWithData from '@/models/commons/req_validator';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../utils/debug_log';

const log = debug('masa:api:events:index');

const reference = (id: string) => FirebaseAdmin.getInstance().Firestore.collection('events').doc(id);

/** 이벤트 root */
export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);

  // POST 메서드 처리
	if (method === 'POST') {
		const validateReq = validateParamWithData<IAddOrderReq>(
      {
        params: req.query as any,
        body: req.body,
      },
      JSCAddOrder,
    );
    if (validateReq.result === false) {
      return res.status(400).json({
        text: validateReq.errorMessage,
      });
    }
    log(`validateReq.result: ${validateReq.result}`);
  
    // 데이터 조작(READ)
    const ref = reference(validateReq.data.params.eventId);
    const doc = await ref.get();
    // 문서가 존재하지않는가?
    if (doc.exists === false) {
      res.status(404).end('문서가 없어요');
      return;
    }
    const returnValue = {
      ...doc.data(),
      id: validateReq.data.params.eventId,
    };
    res.json(returnValue);
	}
  res.status(400).send('bad request');
}

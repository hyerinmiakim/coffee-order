import { IAddEventReq } from '@/controllers/event/interface/IAddEventReq';
import { IFindEventReq } from '@/controllers/event/interface/IFindEventReq';
import { IUpdateEventReq } from '@/controllers/event/interface/IUpdateEventReq';
import { JSCAddEvent } from '@/controllers/event/jsc/JSCAddEvent';
import { JSCFindEvent } from '@/controllers/event/jsc/JSCFindEvent';
import { JSCUpdateEvent } from '@/controllers/event/jsc/JSCUpdateEvent';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import validateParamWithData from '@/models/commons/req_validator';
import { NextApiRequest, NextApiResponse } from 'next';
import { Methods } from './index';


export async function checkAuthority(req: NextApiRequest, res: NextApiResponse) {
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

  return userId;
  /*
    타입스크립트 특성상 함수 리턴타입을 제한해야할 것 같은데,
    이러한 경우 것이 실무에서 주로 사용하는지 의문입니다.
  */
}

export function checkValidation(req: NextApiRequest, res: NextApiResponse, methodType: Methods) {
  let validateReq: any;

  if (methodType === Methods.GET) {
    validateReq = validateParamWithData<IFindEventReq>(
      {
        params: req.query as any,
      },
      JSCFindEvent
    );
  } else if (methodType === Methods.POST) {
    validateReq = validateParamWithData<IAddEventReq>(
      {
        body: req.body
      },
      JSCAddEvent
    );
  } else if (methodType === Methods.PUT) {
    validateReq = validateParamWithData<IUpdateEventReq>(
      {
        params: req.query as any,
        body: req.body,
      },
      JSCUpdateEvent
    );
  }

  if (validateReq.result === false) {
    return res.status(400).json({
      text: validateReq.errorMessage,
    });
  }

  return validateReq;
}

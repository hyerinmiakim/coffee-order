import { NextApiRequest, NextApiResponse } from 'next';
import FirebaseAdmin from "@/models/commons/firebase_admin.model";
import {IEvent} from "@/models/interface/IEvent";
import validateParamWithData from "@/models/commons/req_validator";
import {IAddEventReq} from "@/controllers/event/interface/IAddEventReq";
import {JSCAddEvent} from "@/controllers/event/jsc/JSCAddEvent";

/** 이벤트 root */
export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const {method} = req;

  const supportMethod = ['POST'];
  if (supportMethod.indexOf(method!) === -1) {
    return res.status(400).end();
  }

  const validateReq = validate(method,req,res);

  switch (method) {

    case 'POST' :
      post(res,validateReq)
      break;

    default :
      res.status(404).json({
        text: '요청 URL 오류(Not Found)',
      });
      break;
  }
}

async function post( res: NextApiResponse<any>,validateReq:any) {

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

  const returnValue = {
    ...addData,
    id: result.id,
  };
  res.json(returnValue);
}

function validate(method: string | undefined, req: NextApiRequest,res:NextApiResponse){
  let validateReq :any;

  switch (method) {
    case 'POST':
      validateReq = validateParamWithData<IAddEventReq>(
          {
            body: req.body,
          },
          JSCAddEvent,
      );
      break;

    default :
      break;
  }

  if (!validateReq.result) {
    return res.status(400).json({
      text: validateReq.errorMessage,
    });
  }

  return validateReq;
}

import { IFindEventReq } from '@/controllers/event/interface/IFindEventReq';
import { IUpdateEventReq } from '@/controllers/event/interface/IUpdateEventReq';
import { JSCFindEvent } from '@/controllers/event/jsc/JSCFindEvent';
import { JSCUpdateEvent } from '@/controllers/event/jsc/JSCUpdateEvent';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import { EventModel } from '../../../models/eventsModel';
import * as eventService from '../../../services/eventService';
import { ValidateResult } from "../../../types";
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
  if (method === "GET") {
    // 검증 
    const validateReq: any = eventValidate(req, res, method);
    
    // 데이터 조작 (Read)
    const returnValue = await eventService.getEvent(validateReq.data.params.eventId);
    // 문서가 존재하지않는가?
    if (!returnValue) {
      res.status(404).end("document not found");
      return;
    }
    res.json({
      ...returnValue, 
      id: validateReq.data.params.eventId
    });
  }

  // PUT 메서드 처리
  if (method === 'PUT') {
    // Authorization 체크 
    const userId = await chkAuthorization(req, res);
    
    // 검증
    const validateReq: any = eventValidate(req, res, method);
    
    const eventData = await eventService.getEvent(validateReq.data.params.eventId);
    // 문서가 존재하지않는가?
    if (!eventData) {
      res.status(404).end("document not found");
      return;
    }
    
    // const eventInfo = doc.data() as IEvent; // doc.data() 결과를 IEvent 인터페이스로 캐스팅
    if (eventData.ownerId !== userId) {
      return res.status(401).json({
        text: '이벤트 수정 권한이 없습니다',
      });
    }

    // 문서에 변경할 값을 넣어줍니다.
    const updateData = await eventService.updateEvent(eventData, validateReq.data.body);
    res.json(updateData);
  }
};


export const eventValidate = (req: NextApiRequest, res: NextApiResponse, method: string) => {
  const supportMethod = ['PUT', 'GET'];
  if (supportMethod.indexOf(method!) === -1) {
    return res.status(400).end();
  }
  let validateReq: ValidateResult;
  if (method === "GET") {
    validateReq = validateParamWithData<IFindEventReq>(
      {
        params: req.query as any,
      },
      JSCFindEvent,
    );
  } else { // PUT인 경우
    // TODO: 타입 때문에 else 사용했지만 PUT으로 제대로 체크 되게 수정 필요 
    //if (method === "PUT") { 
    validateReq = validateParamWithData<IUpdateEventReq>(
      {
        params: req.query as any,
        body: req.body,
      },
      JSCUpdateEvent,
    );
  } 
  log(`validateReq.result: ${validateReq.result}`);
  if (validateReq.result === false) {
    return res.status(400).json({
      text: validateReq.errorMessage,
    });
  }

  return validateReq;
}


export const chkAuthorization = async (req: NextApiRequest, res: NextApiResponse) => {
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
}
/* eslint-disable prettier/prettier */

import { IAddEventReq } from '@/controllers/event/interface/IAddEventReq';
import { IFindEventReq } from '@/controllers/event/interface/IFindEventReq';
import { IUpdateEventReq } from '@/controllers/event/interface/IUpdateEventReq';
import { JSCAddEvent } from '@/controllers/event/jsc/JSCAddEvent';
import { JSCFindEvent } from '@/controllers/event/jsc/JSCFindEvent';
import { JSCUpdateEvent } from '@/controllers/event/jsc/JSCUpdateEvent';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import validateParamWithData from '@/models/commons/req_validator';
import { IEvent } from '@/models/interface/IEvent';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../../utils/debug_log';

const log = debug('masa:api:events:[eventId]:index');

// get firestore document reference
async function getFireStoreDoc(eventId: string, res:NextApiResponse){
  const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(eventId);
  const doc = await ref.get();
  if (doc.exists === false) {
    res.status(404).end('There is no document');
  }
  return {ref, doc};
}

// Ajv validator
export function validateReqData(method: string, req: NextApiRequest, res: NextApiResponse):any {
  let validateReq :any;
  if(method==='GET'){
    validateReq = validateParamWithData<IFindEventReq>(
      {
        params: req.query as any, //eventId
      },
      JSCFindEvent,
    );
  }
  else if(method==='PUT'){
    validateReq = validateParamWithData<IUpdateEventReq>( //param:any, schema:JSONSchema6
      {
        params: req.query as any, //eventId
        body: req.body,           //수정 사항
      }, 
      JSCUpdateEvent, 
    );
  }
  else if(method==='POST'){
    validateReq = validateParamWithData<IAddEventReq>(
      {
        body: req.body,
      },
      JSCAddEvent,
    );
  }

  if (validateReq.result === false) {
    return res.status(400).json({
      text: validateReq.errorMessage,
    });
  }
  return validateReq;
}


// Authorization
export async function checkUserToken(req:NextApiRequest, res:NextApiResponse): Promise<string | void>{
  const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(400).end('There is no token');
    }
    let userId = '';
    try {
      // 유효한 토큰인지 확인
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      userId = decodedIdToken.uid;
      
    } 
    catch (err) { // 올바르지 않으면 뱉어내기
      return res.status(400).end('invalid token');
    }
    return userId;
}

// Main Function
export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);

  const supportMethod = ['PUT', 'GET'];
  if (supportMethod.indexOf(method!) === -1) {  //supportMethod 에 포함되지 않은 method는 400
    return res.status(400).end('Your request is not supported');
  }

  if(method==='GET'){
    const validateReq = validateReqData(method, req, res);
    const {doc} = await getFireStoreDoc(validateReq.data.params.eventId, res); 

    // id와 함께 문서 정보를 반환한다.
    const returnValue = {
      ...doc.data(),
      id: validateReq.data.params.eventId,  
    };
    res.json(returnValue); 

  }

 
  else if (method === 'PUT') {
    const userId = await checkUserToken(req,res);
    const validateReq = validateReqData(method, req, res);
    const {ref, doc} = await getFireStoreDoc(validateReq.data.params.eventId, res);

    // userId와 비교 (인가 처리)
    const eventInfo = doc.data() as IEvent; // doc.data() 결과를 IEvent 인터페이스로 캐스팅
      if (eventInfo.ownerId !== userId) { //eventInfo.ownerId : 문서를 만든 사람 | userId : token으로 구별하는 사람
        return res.status(401).json({
          text: "You're not authorized to access this event",
        });
      }

    // 업데이트할 값
    const updateData = {
      ...eventInfo,
      ...validateReq.data.body,
    };
    // 문서에 변경할 값을 넣어줍니다.
    await ref.update(updateData);
    res.json(updateData);
  }
}

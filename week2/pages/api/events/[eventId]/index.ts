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

export enum Methods{
  GET,
  POST, 
  PUT
}

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // eslint-disable-next-line no-console
  const { method } = req;
  log(method);

  const supportMethod = ['PUT', 'GET'];
  if (supportMethod.indexOf(method!) === -1) {
    return res.status(400).end();
  }

  if(method === 'GET'){
    const validateReq = checkValidation(req,res,Methods.GET)
  
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
  
  if(method === 'PUT'){
    const userId = await checkAuthority(req,res)
    const validateReq = checkValidation(req,res,Methods.PUT)

    const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(validateReq.data.params.eventId);
    
    const doc = await ref.get();
    // 문서가 존재하지않는가?
    if (doc.exists === false) {
      res.status(404).end('Not Found Document');
      return;
    }
    
    //updateDoc 
    //userId 기반으로 비교한다.
    const eventInfo = doc.data() as IEvent; // doc.data() 결과를 IEvent 인터페이스로 캐스팅
    if (eventInfo.ownerId !== userId) {
      return res.status(401).json({
        text: '이벤트 수정 권한이 없습니다',
      });
    }

    //Update 구문
    const updateData = {
      ...eventInfo,
      ...validateReq.data.body,
    };
    // 문서에 변경할 값을 넣어줍니다.
    await ref.update(updateData);
    res.json(updateData);

  }
}

export async function checkAuthority(req:NextApiRequest, res:NextApiResponse){
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

export function checkValidation(req:NextApiRequest, res:NextApiResponse, methodType: Methods){
  let validateReq:any

  if(methodType === Methods.GET){
    validateReq = validateParamWithData<IFindEventReq>(
      {
        params: req.query as any,
      },
      JSCFindEvent,
    );
  }else if(methodType === Methods.POST){
    validateReq = validateParamWithData<IAddEventReq>(
      {
        body : req.body
      },
      JSCAddEvent,
    );
  }else if(methodType === Methods.PUT){
     validateReq = validateParamWithData<IUpdateEventReq>(
      {
        params: req.query as any,
        body: req.body,
      },
      JSCUpdateEvent,
    );
  }

  if (validateReq.result === false) {
    return res.status(400).json({
      text: validateReq.errorMessage,
    });
  }

  return validateReq;
}
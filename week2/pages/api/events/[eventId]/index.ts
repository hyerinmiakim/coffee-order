/* eslint-disable prettier/prettier */

import { IFindEventReq } from '@/controllers/event/interface/IFindEventReq';
import { IUpdateEventReq } from '@/controllers/event/interface/IUpdateEventReq';
import { JSCFindEvent } from '@/controllers/event/jsc/JSCFindEvent';
import { JSCUpdateEvent } from '@/controllers/event/jsc/JSCUpdateEvent';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import validateParamWithData from '@/models/commons/req_validator';
import { IEvent } from '@/models/interface/IEvent';
import { NextApiRequest, NextApiResponse } from 'next';
import debug from '../../../../utils/debug_log';

const log = debug('masa:api:events:[eventId]:index');


//문서 존재여부 확인 function.
async function getDoc(eventId: string, res: NextApiResponse) {
  const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(eventId);
  const doc = await ref.get();

  if(doc.exists === false){
    res.status(404).end('404ERROR');
  }
  return {ref,doc} ;

}

//Authrization
// eslint-disable-next-line no-shadow
async function Authfunction(req:NextApiRequest, res:NextApiResponse):Promise<string | void>{
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
  catch (err) { 
    return res.status(400).end('invalid token');
  }
  return userId;
}


//validation.
function validation({ method, req, res }: { method: string; req: NextApiRequest; res: NextApiResponse; }): any{

  let validateReq :any;

  if(method === 'GET'){
    validateReq = validateParamWithData<IFindEventReq>(
      {
        params: req.query as any, //eventId
      },
      JSCFindEvent,
    );

  }
  else if(method === 'PUT'){
    validateReq = validateParamWithData<IUpdateEventReq>( 
      {
      params: req.query as any, //eventId
      body: req.body,           
      }, 
      JSCUpdateEvent, 
    );
  } 
  else if (validateReq.result === false) {
    return res.status(400).json({
      text: validateReq.errorMessage,
    });
  }
  return validateReq;


}


//main function
export default async function handle(req: NextApiRequest, res: NextApiResponse):Promise<void> {
// AsyncFunction객체를 반환하는 하나의 비동기 함수를 정의 즉 handle 이란 객체를 반환하는 함수를 정의 

  const { method } = req;

  log(method);

  const supportMethod = ['PUT', 'GET'];
  //배열로 supportMethod 란 이름의 객체 에 put, get이라는 string이 담김
  if (supportMethod.indexOf(method!) === -1) {
    return res.status(400).end();
  }
  if (method === 'GET') {
    // 검증
    const validateReq = validation({ method, req, res });
    const {doc} = await getDoc(validateReq.data.params.eventId, res); 
  
    const returnValue = {
      ...doc.data(),
      id: validateReq.data.params.eventId,
    };

    //조작 후 return 
    res.json(returnValue);
    }

  else if(method==='PUT'){
    const userId = await Authfunction(req,res);
    const validateReq = validation({ method, req, res });
    const {ref, doc} = await getDoc(validateReq.data.params.eventId, res);
 
    const eventInfo = doc.data() as IEvent;  // doc.data() 결과를 IEvent 인터페이스로 캐스팅
    if (eventInfo.ownerId !== userId) { 
      return res.status(401).json({
        text: '이벤트 수정 권한이 없습니다',
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


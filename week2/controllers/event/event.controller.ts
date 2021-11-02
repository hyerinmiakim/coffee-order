import { NextApiRequest, NextApiResponse } from 'next';
import { IAddEventReq } from '@/controllers/event/interface/IAddEventReq';
import { JSCAddEvent } from '@/controllers/event/jsc/JSCAddEvent';
import FirebaseRef from '@/models/commons/firebase_ref.model';
import validateParamWithData from '@/models/commons/req_validator';
import { IEvent } from '@/models/interface/IEvent';
import { checkIsValidateDoc, checkIsValidateReq, checkIsValidateToken } from '@/utils/check_validate';
import { getUserId } from '@/utils/get_userInfo';
import { IFindEventReq } from './interface/IFindEventReq';
import { IUpdateEventReq } from './interface/IUpdateEventReq';
import { JSCFindEvent } from './jsc/JSCFindEvent';
import { JSCUpdateEvent } from './jsc/JSCUpdateEvent';

const FirebaseEventRef = new FirebaseRef('events');

export const addOrder = async (req: NextApiRequest, res: NextApiResponse): Promise<any> => {
  const validateReq = validateParamWithData<IAddEventReq>(
    {
      body: req.body,
    },
    JSCAddEvent,
  );
  checkIsValidateReq(res, validateReq);

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

  const collectionRef = await FirebaseEventRef.getCollectionRef();
  const result = await collectionRef.add(addData);

  const returnValue = {
    ...addData,
    id: result.id,
  };
  res.json(returnValue);
};

export const getEvent = async (req: NextApiRequest, res: NextApiResponse): Promise<any> => {
  const validateReq = validateParamWithData<IFindEventReq>(
    {
      params: req.query as any,
    },
    JSCFindEvent,
  );
  checkIsValidateReq(res, validateReq);

  //READ
  const doc = await FirebaseEventRef.getDoc(validateReq.data.params.eventId);
  checkIsValidateDoc(res, doc);

  const returnValue = {
    ...doc.data(),
    id: validateReq.data.params.eventId,
  };
  res.json(returnValue);
};

export const updateEvent = async (req: NextApiRequest, res: NextApiResponse): Promise<any> => {
  const token = req.headers.authorization;
  checkIsValidateToken(res, token || '');
  const userId = await getUserId(res, token || '');

  const validateReq = validateParamWithData<IUpdateEventReq>(
    {
      params: req.query as any,
      body: req.body,
    },
    JSCUpdateEvent,
  );
  checkIsValidateReq(res, validateReq);

  //인가
  const docRef = await FirebaseEventRef.getDocRef(validateReq.data.params.eventId);
  const doc = await docRef.get();

  // 문서가 존재하지않는가?
  checkIsValidateDoc(res, doc);
  const eventInfo = doc.data() as IEvent; // doc.data() 결과를 IEvent 인터페이스로 캐스팅
  if (eventInfo.ownerId !== userId) {
    return res.status(401).json({
      text: '이벤트 수정 권한이 없습니다',
    });
  }

  const updateData = {
    ...eventInfo,
    ...validateReq.data.body,
  };

  // 문서에 변경할 값을 넣어줍니다.
  await docRef.update(updateData);
  res.json(updateData);
};

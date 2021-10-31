import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import { IEvent } from '@/models/interface/IEvent';
import { NextApiResponse } from 'next';

export async function updateEvents(res: NextApiResponse<any>, validateReq: any, userId: string | void) {
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
  return updateData;
}
export async function getEvents(res: NextApiResponse<any>, validateReq: any) {
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

  return returnValue;
}

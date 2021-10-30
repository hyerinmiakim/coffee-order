/* eslint-disable prettier/prettier */
import { NextApiRequest, NextApiResponse } from 'next';
import { IFindEventReq } from '@/controllers/event/interface/IFindEventReq';
import { IUpdateEventReq } from '@/controllers/event/interface/IUpdateEventReq';
import { JSCFindEvent } from '@/controllers/event/jsc/JSCFindEvent';
import { JSCUpdateEvent } from '@/controllers/event/jsc/JSCUpdateEvent';
import FirebaseAdmin from '@/models/commons/firebase_admin.model';
import validateParamWithData from '@/models/commons/req_validator';
import { IEvent } from '@/models/interface/IEvent';
import debug from '../../../../utils/debug_log';

const log = debug('masa:api:events:[eventId]:index');

interface IResponse {
  ok: boolean;
  htmlStatus: number;
  error?: string;
  data?: any;
}

const getDocumentData = async (
  ref: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>,
): Promise<IResponse> => {
  const doc = await ref.get();

  if (doc.exists === false) {
    return { ok: false, htmlStatus: 404, error: '이벤트와 일치하는 문서가 없습니다.' };
  }
  return {
    ok: true,
    htmlStatus: 200,
    data: doc.data(),
  };
};
const getEvent = async (query: any): Promise<IResponse> => {
  const validateReq = validateParamWithData<IFindEventReq>({ params: query }, JSCFindEvent);
  if (validateReq.result === false) {
    return { ok: false, htmlStatus: 400, error: validateReq.errorMessage };
  }
  log(`validateReq.result: ${validateReq.result}`);
  const { eventId } = validateReq.data.params;
  const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(eventId);
  const documentData = await getDocumentData(ref);
  if (!documentData.ok) {
    return { ok: false, htmlStatus: documentData.htmlStatus, error: documentData.error };
  }
  return {
    ok: true,
    htmlStatus: documentData.htmlStatus,
    data: { ...documentData.data, id: validateReq.data.params.eventId },
  };
};

interface IUpdateEvent {
  token: string;
  query: any;
  body: any;
}
const updateEvent = async ({ token, query, body }: IUpdateEvent): Promise<IResponse> => {
  let userId = '';
  try {
    const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
    userId = decodedIdToken.uid;
  } catch (err) {
    return { ok: false, htmlStatus: 400, error: '이상한 토큰' };
  }

  const validateReq = validateParamWithData<IUpdateEventReq>({ params: query, body }, JSCUpdateEvent);
  if (validateReq.result === false) {
    return { ok: false, htmlStatus: 400, error: validateReq.errorMessage };
  }
  const { eventId } = validateReq.data.params;
  const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(eventId);
  const documentData = await getDocumentData(ref);
  // 문서가 존재하지않는가?
  if (!documentData.ok) {
    return { ok: false, htmlStatus: documentData.htmlStatus, error: documentData.error };
  }
  const eventInfo = documentData.data as IEvent;
  if (eventInfo.ownerId !== userId) {
    return { ok: false, htmlStatus: 401, error: '이벤트 수정 권한이 없습니다' };
  }

  // eventInfo.closed = validateReq.data.body.closed ?? false;
  // 업데이트할 값
  const updateData = {
    ...eventInfo,
    ...validateReq.data.body,
  };
  // 문서에 변경할 값을 넣어줍니다.
  await ref.update(updateData);
  return {
    ok: true,
    htmlStatus: 201,
    data: updateData,
  };
};

export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { method, query, body } = req;
  log(method);
  const supportedMethod = ['PUT', 'GET'];
  if (supportedMethod.indexOf(method!) === -1) {
    return res.status(400).end();
  }
  if (method === 'GET') {
    const result = await getEvent(query);
    if (result.ok) {
      return res.status(result.htmlStatus).json(result.data);
    }

    return res.status(result.htmlStatus).send(result.error);
  }
  if (method === 'PUT') {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(400).end('token?');
    }
    const result = await updateEvent({ token, query, body });

    if (result.ok) {
      return res.status(result.htmlStatus).json(result.data);
    }

    return res.status(result.htmlStatus).send(result.error);
  }
}

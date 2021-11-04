import authenticate from '@/models/commons/req_authenticator';
import validateParamWithData from '@/models/commons/req_validator';
import { Events } from '@/models/events.model';
import { HttpStatusCode } from '@/utils/http';
import { HttpError } from '@/utils/error';
import debug from '@/utils/debug_log';
import { ControllerMethodParam } from './interface/ControllerMethod';
import { IFindEventReq } from './event/interface/IFindEventReq';
import { IAddEventReq } from './event/interface/IAddEventReq';
import { IUpdateEventReq } from './event/interface/IUpdateEventReq';
import { JSCFindEvent } from './event/jsc/JSCFindEvent';
import { JSCAddEvent } from './event/jsc/JSCAddEvent';
import { JSCUpdateEvent } from './event/jsc/JSCUpdateEvent';

const log = debug('masa:controller:events');

async function find({ res, ...req }: ControllerMethodParam): Promise<void> {
  // 요청 데이터를 검증하고 변환
  const reqValidation = validateParamWithData<IFindEventReq>({ params: req.query }, JSCFindEvent);
  if (reqValidation.result === false) {
    throw new HttpError(HttpStatusCode.BadRequest, reqValidation.errorMessage);
  }
  const { eventId } = reqValidation.data.params;
  log(`eventId: ${eventId}`);

  // DB로부터 이벤트를 가져오기
  const eventWithId = await Events.find({ eventId });
  if (eventWithId === null) {
    throw new HttpError(HttpStatusCode.NotFound, 'not exist event');
  }

  // 가져온 이벤트를 응답
  return res.json(eventWithId);
}

async function add({ res, ...req }: ControllerMethodParam): Promise<void> {
  // 요청 헤더를 통해 인증 여부를 확인
  const reqAuthentication = await authenticate(req.headers);
  if (reqAuthentication.result === false) {
    throw new HttpError(HttpStatusCode.BadRequest, reqAuthentication.errorMessage);
  }
  const { uid: userId } = reqAuthentication.data;
  log(`userId: ${userId}`);

  // 요청 데이터를 검증하고 변환
  const reqValidation = validateParamWithData<IAddEventReq>({ body: req.body }, JSCAddEvent);
  if (reqValidation.result === false) {
    throw new HttpError(HttpStatusCode.BadRequest, reqValidation.errorMessage);
  }
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    body: { closed: _, ...body },
  } = reqValidation.data;

  // DB에 이벤트를 추가하기
  const addedEventWithId = await Events.add({
    desc: '',
    ...body,
  });

  // 추가된 이벤트를 응답
  return res.json(addedEventWithId);
}

async function update({ res, ...req }: ControllerMethodParam): Promise<void> {
  // 요청 헤더를 통해 인증 여부를 확인
  const reqAuthentication = await authenticate(req.headers);
  if (reqAuthentication.result === false) {
    throw new HttpError(HttpStatusCode.BadRequest, reqAuthentication.errorMessage);
  }
  const { uid: userId } = reqAuthentication.data;
  log(`userId: ${userId}`);

  // 요청 데이터를 검증하고 변환
  const reqValidation = validateParamWithData<IUpdateEventReq>({ params: req.query, body: req.body }, JSCUpdateEvent);
  if (reqValidation.result === false) {
    throw new HttpError(HttpStatusCode.BadRequest, reqValidation.errorMessage);
  }
  const {
    params: { eventId },
    body,
  } = reqValidation.data;
  log(`eventId: ${eventId}`);

  // DB로부터 이벤트를 가져오기
  const eventWithId = await Events.find({ eventId });
  if (eventWithId === null) {
    throw new HttpError(HttpStatusCode.NotFound, 'not exist event');
  }

  // 이벤트를 통해 인가 여부를 검증
  if (eventWithId.ownerId !== userId) {
    throw new HttpError(HttpStatusCode.Unauthorized, 'unauthrized');
  }

  // DB의 이벤트를 업데이트하기
  const updatedEventWithId = await Events.update({
    ...eventWithId,
    ...body,
  });
  if (updatedEventWithId === null) {
    throw new HttpError(HttpStatusCode.NotFound, 'not exist event');
  }

  // 업데이트된 이벤트를 응답
  return res.json(updatedEventWithId);
}

export { find, add, update };

/* eslint-disable prettier/prettier */
import { NextApiRequest as Request, NextApiResponse as Response } from 'next';
import debug from '../../utils/debug_log';
import validateParamWithData from '../../models/commons/req_validator';

import { IAddEventReq } from './interface/IAddEventReq';
import { IFindEventReq } from './interface/IFindEventReq';
import { IUpdateEventReq } from './interface/IUpdateEventReq';
import { IRemoveOrderReq } from './interface/IRemoveOrderReq';
import { JSCAddEvent } from './jsc/JSCAddEvent';
import { JSCFindEvent } from './jsc/JSCFindEvent';
import { JSCUpdateEvent } from './jsc/JSCUpdateEvent';
import { Events } from '../../models/events.model';
import FirebaseAdmin from '../../models/commons/firebase_admin.model';
import { IAddOrderReq } from './interface/IAddOrderReq';
import { JSCAddOrder } from './jsc/JSCAddOrder';
import { JSCRemoveOrder } from './jsc/JSCRemoveOrder';

const log = debug('massa:controller:event');

interface IVerifyTokenAndReturnId {
  ok: boolean;
  htmlStatus?: number;
  userId?: string;
  error?: string;
}

export default class EventController {
  /* 토큰을 검증하는 메소드입니다. */
  static async verifyTokenAndReturnId(token: string | undefined): Promise<IVerifyTokenAndReturnId> {
    if (token === undefined) {
      return { ok: false, htmlStatus: 401, error: '해당 기능은 로그인 후에 사용하실 수 있습니다..' };
    }
    try {
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      return { ok: true, userId: decodedIdToken.uid };
    } catch (error) {
      return { ok: false, error: '토큰의 검증을 실패했습니다.' };
    }
  }

  static async addEvent(req: Request, res: Response) {
    /* 토큰을 검증하는 과정을 verifyTokenAndReturnId 메소드에 작성했습니다. */
    const token = req.headers.authorization;
    const decodedIdToken = await this.verifyTokenAndReturnId(token);
    if (!decodedIdToken.ok) {
      return res.status(401).json({ text: decodedIdToken.error });
    }
    log(req.body);
    const validateReq = validateParamWithData<IAddEventReq>(
      {
        body: req.body,
      },
      JSCAddEvent,
    );
    if (validateReq.result === false) {
      return res.status(400).json({
        text: validateReq.errorMessage,
      });
    }

    // 이벤트 생성
    try {
      const reqParams = {
        ...validateReq.data.body,
        desc: validateReq.data.body.desc !== undefined ? validateReq.data.body.desc : '',
      };
      const result = await Events.add(reqParams);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500);
    }
  }

  static async updateEvent(req: Request, res: Response) {
    /* 토큰을 검증하는 과정을 verifyTokenAndReturnId 메소드에 작성했습니다. */
    const token = req.headers.authorization;
    const decodedIdToken = await this.verifyTokenAndReturnId(token);
    if (!decodedIdToken.ok) {
      return res.status(401).json({ text: decodedIdToken.error });
    }
    const userId = decodedIdToken?.userId;

    const validateReq = validateParamWithData<IUpdateEventReq>(
      {
        params: req.query,
        body: req.body,
      },
      JSCUpdateEvent,
    );
    log(req.body);
    if (validateReq.result === false) {
      return res.status(400).json({
        text: validateReq.errorMessage,
      });
    }

    // 이벤트 수정
    try {
      const eventInfo = await Events.find({
        eventId: validateReq.data.params.eventId,
      });
      log({ ownerId: eventInfo.ownerId, userId });
      if (eventInfo.ownerId !== userId) {
        return res.status(401).json({
          text: '이벤트 수정 권한이 없습니다',
        });
      }
      const reqParams = {
        ...validateReq.data.body,
        id: validateReq.data.params.eventId,
      };
      log(validateReq.data.body);
      const result = await Events.update(reqParams);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500);
    }
  }

  static async findEvent(req: Request, res: Response) {
    const validateReq = validateParamWithData<IFindEventReq>(
      {
        params: req.query,
      },
      JSCFindEvent,
    );
    if (validateReq.result === false) {
      return res.status(400).json({
        text: validateReq.errorMessage,
      });
    }
    try {
      const result = await Events.find({
        eventId: validateReq.data.params.eventId,
      });
      // 주문 마감 시간이 없다면 바로 결과 반환
      if (result.lastOrder === undefined) {
        return res.json(result);
      }
      const now = new Date();
      const closedDate = new Date(result.lastOrder);
      if (now.getTime() >= closedDate.getTime()) {
        return res.json({ ...result, closed: true });
      }
      res.json(result);
    } catch (err) {
      return res.status(404).end();
    }
  }

  /** 이벤트 안에 주문 목록을 조회한다 */
  static async findOrders(req: Request, res: Response) {
    const validateReq = validateParamWithData<IFindEventReq>(
      {
        params: req.query,
      },
      JSCFindEvent,
    );
    if (validateReq.result === false) {
      return res.status(400).json({
        text: validateReq.errorMessage,
      });
    }
    try {
      // event 문서 존재하는지 확인
      await Events.find({ eventId: validateReq.data.params.eventId });
      // 이벤트 안에 전체 주문을 조회한다.
      const result = await Events.findOrders({ eventId: validateReq.data.params.eventId });
      return res.json(result);
    } catch (err) {
      return res.status(500).send((err as any).toString());
    }
  }

  static async addOrder(req: Request, res: Response) {
    /* 토큰을 검증하는 과정을 verifyTokenAndReturnId 메소드에 작성했습니다. */
    const token = req.headers.authorization;
    const decodedIdToken = await this.verifyTokenAndReturnId(token);
    if (!decodedIdToken.ok) {
      return res.status(401).json({ text: decodedIdToken.error });
    }

    const validateReq = validateParamWithData<IAddOrderReq>(
      {
        params: req.query,
        body: req.body,
      },
      JSCAddOrder,
    );
    if (validateReq.result === false) {
      return res.status(400).send({
        text: validateReq.errorMessage,
      });
    }
    try {
      const result = await Events.addOrder({
        eventId: validateReq.data.params.eventId,
        order: validateReq.data.body.order,
      });
      return res.json(result);
    } catch (err) {
      return res.status(500).send((err as any).toString());
    }
  }

  /** 주문 삭제 시작 */
  static async deleteOrder(req: Request, res: Response) {
    try {
      const { guestId, eventId } = (req.query as unknown) as { guestId: string; eventId: string };
      /* 토큰을 검증하는 과정을 verifyTokenAndReturnId 메소드에 작성했습니다. */
      const token = req.headers.authorization;
      const decodedIdToken = await this.verifyTokenAndReturnId(token);
      if (!decodedIdToken.ok) {
        return res.status(400).json({ text: decodedIdToken.error });
      }
      const userId = decodedIdToken?.userId;
      /* 로그인한 유저가 주문을 생성한 사람일 때만 삭제할 수 있습니다. */
      if (guestId !== `${userId}`) {
        return res.status(403).json({ text: '주문을 작성한 유저만 삭제하실 수 있습니다.' });
      }

      const validateReq = validateParamWithData<IRemoveOrderReq>({ params: req.query }, JSCRemoveOrder);
      if (validateReq.result === false) {
        return res.status(400).send({
          text: validateReq.errorMessage,
        });
      }

      await Events.removeOrder({ eventId, guestId });

      return res.json({ text: '삭제에 성공했습니다.' });
    } catch (error) {
      res.status(500).json({ text: '에러가 발생했습니다.' });
    }
  }
}

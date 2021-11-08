import { NextApiRequest as Request, NextApiResponse as Response } from 'next';

import debug from '../../utils/debug_log';
import validateParamWithData from '../../models/commons/req_validator';

import { IAddEventReq } from './interface/IAddEventReq';
import { IFindEventReq } from './interface/IFindEventReq';
import { IUpdateEventReq } from './interface/IUpdateEventReq';
import { IRemoveOrderReq } from "./interface/IRemoveOrderReq";
import { JSCAddEvent } from './jsc/JSCAddEvent';
import { JSCFindEvent } from './jsc/JSCFindEvent';
import { JSCUpdateEvent } from './jsc/JSCUpdateEvent';
import { JSCRemoveOrder } from "./jsc/JSCRemoveOrder";
import { Events } from '../../models/events.model';
import FirebaseAdmin from '../../models/commons/firebase_admin.model';
import { IAddOrderReq } from './interface/IAddOrderReq';
import { JSCAddOrder } from './jsc/JSCAddOrder';

const log = debug('massa:controller:event');

export default class EventController {
  static async addEvent(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(401).end("Unauthorized");
    }
    try {
      await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
    } catch (err) {
      return res.status(401).end("Unauthorized");
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
      return res.status(201).json(result);
    } catch (err) {
      return res.status(500);
    }
  }

  static async updateEvent(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(401).end("Unauthorized");
    }
    let userId = '';
    try {
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      userId = decodedIdToken.uid;
    } catch (err) {
      return res.status(401).end("Unauthorized");
    }
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
        return res.status(403).json({
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

  static async findAllEvent(req: Request, res: Response) {
    
    try {
      const result = await Events.findAll();
      
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
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(401).end("Unauthorized");
    }
    try {
      await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
    } catch (err) {
      return res.status(401).end("Unauthorized");
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

  static async deleteOrder(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(401).end("Unauthorized");
    }
    try {
      await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
    } catch (err) {
      log("verifyIdToken " + err.toString());
      return res.status(401).end("Unauthorized");
    }
    const validateReq = validateParamWithData<IRemoveOrderReq>(
      {
        params: req.query
      },
      JSCRemoveOrder,
    );
    if (validateReq.result === false) {
      return res.status(400).send({
        text: validateReq.errorMessage,
      });
    }
    try {
      await Events.removeOrder({
        eventId: validateReq.data.params.eventId,
        guestId: validateReq.data.params.guestId
      })

      return res.json({});
    } catch (err) {
      return res.status(500).send((err as any).toString());
    }
  }
}

import { NextApiRequest as Request, NextApiResponse as Response } from 'next';

import debug from '../../utils/debug_log';

import validateParamWithData from '../../models/commons/req_validator';

import { IBeverage } from '../../models/interface/IEvent';
import { IMenuListItem } from '../../models/interface/IMenuListItem';
import { MenuListModel } from '../../models/menuList.model';
import FirebaseAdmin from '../../models/commons/firebase_admin.model';
import { JSCAddMenuList } from './jsc/JSCAddMenuList';
import { JSCUpdateMenuList } from './jsc/JSCUpdateMenuList';
import { JSCDeleteMenuList } from './jsc/JSCDeleteMenuList';
import { IAddMenuListReq } from './interface/IAddMenuList';
import { IUpdateMenuListReq } from './interface/IUpdateMenuList';
import { IDeleteMenuListReq } from './interface/IDeleteMenuList';

const log = debug('massa:controller:menu_list');
export default class MenuListController {
  static async findAllByOwnerId(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(400).end();
    }
    let ownerId = '';
    try {
      const { uid } = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      ownerId = uid;
    } catch (err) {
      return res.status(400).end();
    }

    try {
      const result = await MenuListModel.findAllByOwnerId({ ownerId });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).send(err.toString());
    }
  }

  static async addMenuList(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(400).end();
    }
    let ownerId = '';
    try {
      const { uid } = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      ownerId = uid;
    } catch (err) {
      return res.status(400).end();
    }

    log(req.body);
    const validateReq = validateParamWithData<IAddMenuListReq>(
      {
        body: req.body,
      },
      JSCAddMenuList,
    );
    if (validateReq.result === false) {
      return res.status(400).json({
        text: validateReq.errorMessage,
      });
    }

    try {
      const reqParams = {
        ...validateReq.data.body,
        ownerId,
      };
      const result = await MenuListModel.add(reqParams);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500);
    }
  }

  static async updateMenuList(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(400).end();
    }
    let ownerId = '';
    try {
      const { uid } = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      ownerId = uid;
    } catch (err) {
      return res.status(400).end();
    }
    const validateReq = validateParamWithData<IUpdateMenuListReq>(
      {
        params: req.query,
        body: req.body,
      },
      JSCUpdateMenuList,
    );
    log(req.body);
    if (validateReq.result === false) {
      return res.status(400).json({
        text: validateReq.errorMessage,
      });
    }
    try {
      const reqParams = {
        ...validateReq.data.body,
        id: validateReq.data.params.menuListId,
        ownerId,
      };
      log({ ownerId, id: validateReq.data.params.menuListId });
      await MenuListModel.update(reqParams);
      return res.status(200).json({
        msg: 'update success',
      });
    } catch (err) {
      return res.status(500);
    }
  }

  static async deleteMenuList(req: Requst, res: Response) {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(400).end();
    }
    let ownerId = '';
    try {
      const { uid } = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      ownerId = uid;
    } catch (err) {
      return res.status(400).end();
    }
    const validateReq = validateParamWithData<IDeleteMenuListReq>(
      {
        params: req.query,
      },
      JSCDeleteMenuList,
    );
    log(req.params);
    if (validateReq.result === false) {
      return res.status(400).json({
        text: validateReq.errorMessage,
      });
    }
    try {
      const reqParams = {
        menuListId: validateReq.data.params.menuListId,
        ownerId,
      };
      log({ ownerId, id: validateReq.data.params.menuListId });
      await MenuListModel.delete(reqParams);
      return res.status(200).json({
        msg: 'delete success',
      });
    } catch (err) {
      return res.status(500);
    }
  }
}

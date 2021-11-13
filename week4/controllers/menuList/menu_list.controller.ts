import { NextApiRequest as Request, NextApiResponse as Response } from 'next';
import { IBeverage } from '../../models/interface/IEvent';
import { IMenuListItem } from '../../models/interface/IMenuListItem';
import { MenuListModel } from '../../models/menuList.model';
import FirebaseAdmin from '../../models/commons/firebase_admin.model';
import validateParamWithData from '../../models/commons/req_validator';
import { JSCAddMenuList } from './jsc/JSCAddMenuList';
import { JSCUpdateMenuList } from './jsc/JSCUpdateMenuList';
import debug from '../../utils/debug_log';

const log = debug('massa:controller:menu_list');

export default class MenuListController {
  static async findAllByOwnerId(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(400).end();
    }

    let decodedToken;
    try {
      decodedToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
    } catch (err) {
      return res.status(400).end();
    }

    log(req.body);

    const ownerId = decodedToken.uid;

    // 이벤트 생성
    try {
      const reqParams = {
        ownerId,
      };
      const result = await MenuListModel.findAllByOwnerId(reqParams);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500);
    }
  }

  static async addMenuList(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(400).end();
    }

    let decodedToken;
    try {
      decodedToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
    } catch (err) {
      return res.status(400).end();
    }

    const ownerId = decodedToken.uid;

    log(req.body);

    const validateReq = validateParamWithData<{ body: Pick<IMenuListItem, 'title' | 'desc' | 'menu'> }>(
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

    // 이벤트 생성
    try {
      const reqParams = {
        ...validateReq.data.body,
        ownerId,
        desc: validateReq.data.body.desc !== undefined ? validateReq.data.body.desc : '',
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

    let decodedToken;
    try {
      decodedToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
    } catch (err) {
      return res.status(400).end();
    }

    const ownerId = decodedToken.uid;

    log(req.body);

    const validateReq = validateParamWithData<{
      params: { menuListId: string };
      body: { title?: string; desc?: string; menu?: IBeverage[] };
    }>(
      {
        params: req.query,
        body: req.body,
      },
      JSCUpdateMenuList,
    );
    if (validateReq.result === false) {
      return res.status(400).json({
        text: validateReq.errorMessage,
      });
    }

    // 이벤트 생성
    try {
      const reqParams = {
        id: validateReq.data.params.menuListId,
        ...validateReq.data.body,
        ownerId,
        desc: validateReq.data.body.desc !== undefined ? validateReq.data.body.desc : '',
      };
      const result = await MenuListModel.update(reqParams);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500);
    }
  }
}

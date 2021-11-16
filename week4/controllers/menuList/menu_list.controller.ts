import { NextApiRequest as Request, NextApiResponse as Response } from 'next';
import { IBeverage } from '../../models/interface/IEvent';
import { IMenuListItem } from '../../models/interface/IMenuListItem';
import { MenuListModel } from '../../models/menuList.model';
import FirebaseAdmin from '../../models/commons/firebase_admin.model';
import validateParamWithData from '../../models/commons/req_validator';
import { JSCAddMenuList } from './jsc/JSCAddMenuList';
import { JSCUpdateMenuList } from './jsc/JSCUpdateMenuList';
import debug from '@/utils/debug_log';

const log = debug('massa:controller:menu_list');

export default class MenuListController {
  static async findAllByOwnerId(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(400).end();
    }
    const { uid } = await this.getUId(token);
    log(req.body);
    try {
      const result = await MenuListModel.findAllByOwnerId({ ownerId: uid });
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
    const { uid } = await this.getUId(token);

    const validateReq = validateParamWithData<{ body: Pick<IMenuListItem, 'title' | 'desc' | 'menu'> }>(
      {
        body: req.body,
      },
      JSCAddMenuList,
    );

    if (validateReq.result === false) {
      return res.status(400).send({
        text: validateReq.errorMessage,
      });
    }
    try {
      const result = await MenuListModel.add({
        title: validateReq.data.body.title,
        desc: validateReq.data.body.desc,
        ownerId: uid,
        menu: validateReq.data.body.menu,
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).send(err.toString());
    }
  }

  static async updateMenuList(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(400).end();
    }
    const { uid } = await this.getUId(token);

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
      return res.status(400).send({
        text: validateReq.errorMessage,
      });
    }

    try {
      const result = MenuListModel.update({
        ownerId: uid,
        id: validateReq.data.params.menuListId,
        title: validateReq.data.body.title,
        desc: validateReq.data.body.desc,
        menu: validateReq.data.body.menu,
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).send(err.toString());
    }
  }

  static async getUId(token: string) {
    const decodedToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
    return { uid: decodedToken.uid };
  }
}

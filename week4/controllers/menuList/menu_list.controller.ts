import { NextApiRequest as Request, NextApiResponse as Response } from 'next';
import { IBeverage } from '../../models/interface/IEvent';
import { IMenuListItem } from '../../models/interface/IMenuListItem';
import { MenuListModel } from '../../models/menuList.model';
import FirebaseAdmin from '../../models/commons/firebase_admin.model';
import validateParamWithData from '../../models/commons/req_validator';
import { JSCAddMenuList } from './jsc/JSCAddMenuList';
import { JSCUpdateMenuList } from './jsc/JSCUpdateMenuList';

export default class MenuListController {
  static async findAllByOwnerId(req: Request, res: Response) {
    res.status(200).json([]);
  }

  static async addMenuList(req: Request, res: Response) {
    res.status(400).end();
  }

  static async updateMenuList(req: Request, res: Response) {
    res.status(400).end();
  }
}

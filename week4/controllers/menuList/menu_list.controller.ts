import { NextApiRequest as Request, NextApiResponse as Response } from 'next';
import { IBeverage } from '../../models/interface/IEvent';
import { IMenuListItem } from '../../models/interface/IMenuListItem';
import { MenuListModel } from '../../models/menuList.model';
import FirebaseAdmin from '../../models/commons/firebase_admin.model';
import validateParamWithData from '../../models/commons/req_validator';
import { JSCAddMenuList } from './jsc/JSCAddMenuList';
import { JSCUpdateMenuList } from './jsc/JSCUpdateMenuList';
import { log } from 'util';

export default class MenuListController {
  static async findAllByOwnerId(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(400).end();
    }
    let userId = '';
    try {
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      userId = decodedIdToken.uid;
    } catch (err) {
      return res.status(400).end();
    }

    const menuLists = await MenuListModel.findAllByOwnerId({ownerId : userId});
    res.status(200).json(menuLists);
  }

  static async addMenuList(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (token === undefined) {
      return res.status(400).end();
    }
    let ownerId = '';
    try {
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      ownerId = decodedIdToken.uid;
    } catch (err) {
      return res.status(400).end();
    }
    /*
      validateParamWithData에서 { body: Pick<IMenuListItem, 'title' | 'desc' | 'menu'> } 이게 어떤식으로 동작하는지 궁금하네요
    */
    const validateReq = validateParamWithData<{ body: Pick<IMenuListItem, 'title' | 'desc' | 'menu'> }    >(
      {
        body : req.body
      },
    JSCAddMenuList);

    if(validateReq.result === false){
      return res.status(400).json({
        text : validateReq.errorMessage
      })
    }

    try{
      const reqParams = {
        ...validateReq.data.body,
        ownerId,
        desc : validateReq.data.body.desc !== undefined ? validateReq.data.body.desc : '',
      }
      const result  = await MenuListModel.add(reqParams);
      return res.status(200).json({...result})
    }catch(err){
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
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      ownerId = decodedIdToken.uid;
    } catch (err) {
      return res.status(400).end();
    }
    
    const validateReq = validateParamWithData< {
      params: { menuListId: string };
      body: { title?: string; desc?: string; menu?: IBeverage[] };
    }>(
      {
        params: req.query,
        body : req.body
      },
      JSCUpdateMenuList);
    
      if(validateReq.result === false){
        return res.status(400).json({
          text : validateReq.errorMessage
        })
      }
      
      try{
        const reqParams = {
          ownerId,
          id : validateReq.data.params.menuListId,
          ...validateReq.data.body,
          desc : validateReq.data.body.desc !== undefined ? validateReq.data.body.desc : '',
        }
        await MenuListModel.update(reqParams);
        return res.status(200).json({"text" : "업데이트 성공..!"})
      }catch(err){
        return res.status(500);
      }
  }
}

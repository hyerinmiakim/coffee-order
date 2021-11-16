import { NextApiRequest as Request, NextApiResponse as Response } from 'next';

import { MenuListModel } from '../../models/menuList.model';
import FirebaseAdmin from '../../models/commons/firebase_admin.model';
import validateParamWithData from '../../models/commons/req_validator';
import { JSCAddMenuList } from './jsc/JSCAddMenuList';
import { JSCUpdateMenuList } from './jsc/JSCUpdateMenuList';
import { IFindMenuList } from './interface/IFindMenuList';
import { JSCFindMenuList } from './jsc/JSCFindMenuList';
import { IAddMenuList } from './interface/IAddMenuList';
import { IUpdateMenuList } from './interface/IUpdateMenuList';

export default class MenuListController {
  static async findAllByOwnerId(req: Request, res: Response) {
    // 토큰 검사
    const token = req.headers.authorization;
    if (token === undefined) {  //토큰 없어
      return res.status(400).end();
    }
    let userId = ''; //이걸 ownerId로 넘겨주자
    try {
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      userId = decodedIdToken.uid;
    } catch (err) {
      return res.status(400).end();
    }

    try {
      const result = await MenuListModel.findAllByOwnerId({
        ownerId:userId
      });
      return res.status(200).json(result);
    } catch (err) {
      return res.status(404).end();
    }
  }

  static async findByMenuListId(req: Request, res: Response) {
    // 토큰 검사
    const token = req.headers.authorization;
    if (token === undefined) {  //토큰 없어
      return res.status(400).end();
    }
    let userId = ''; //이걸 ownerId로 넘겨주자
    try {
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      userId = decodedIdToken.uid;
    } catch (err) {
      return res.status(400).end();
    }

    const validateReq = validateParamWithData<IFindMenuList>(
    {
      params: req.query
    },
    JSCFindMenuList,
    );
    log(req.body);

    if (validateReq.result === false) {
      return res.status(400).json({
        text: validateReq.errorMessage,
      });
    }
    try {
      const result = await MenuListModel.find({menuListId : validateReq.data.params.menuListId});
      return res.status(200).json(result);
    } catch (err) {
      return res.status(404).end();
      }
  }

  static async addMenuList(req: Request, res: Response) {
    // 토큰 검사
    const token = req.headers.authorization;
    if (token === undefined) {  //토큰 없어
      return res.status(400).end();
    }
    let userId = ''; //이걸 ownerId로 넘겨주자
    try {
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      userId = decodedIdToken.uid;
    } catch (err) {
      return res.status(400).end();
    }
    //request data 확인
    const validateReq = validateParamWithData<IAddMenuList>(
      {
        body : req.body,  // title, desc, menu
      },
      JSCAddMenuList,
    );
    log(req.body);

    if (validateReq.result === false) {
      return res.status(400).json({
        text: validateReq.errorMessage,
      });
    }
    // 메뉴판 생성
    try {
      console.log(validateReq.data.body);
      const reqParams={
        ...validateReq.data.body,
        ownerId : userId,
      }
      const result = await MenuListModel.add(reqParams);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500);
    }
  }

  static async updateMenuList(req: Request, res: Response) {
    // 토큰 검사
    const token = req.headers.authorization;
    if (token === undefined) {  //토큰 없어
      return res.status(400).end();
    }
    let userId = ''; //이걸 ownerId로 넘겨주자
    try {
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      userId = decodedIdToken.uid;
    } catch (err) {
      return res.status(400).end();
    }
    //request data 확인
    const validateReq = validateParamWithData<IUpdateMenuList>(
      {
        params: req.query,
        body : req.body,  // title, desc, menu
      },
      JSCUpdateMenuList,
    );
    log(req.body);
    if (validateReq.result === false) {
      return res.status(400).json({
        text: validateReq.errorMessage,
      });
    }
    // 메뉴 수정
    try{
      const reqData={
        ownerId : userId,
        id : validateReq.data.params.menuListId,
        ...validateReq.data.body,
      };
      // log('reqData');
      // log(reqData);
      await MenuListModel.update(reqData);
      return res.status(200).end();
    }catch(err: any){
      return res.status(400).end();
    }
  }
}

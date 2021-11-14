import { NextApiRequest as Request, NextApiResponse as Response } from 'next';
import { JSONSchema6 } from 'json-schema';

import FirebaseAdmin from '../../models/commons/firebase_admin.model';
import { MenuListModel } from '../../models/menuList.model';
import debug from '../../utils/debug_log';
import validateParamWithData from '../../models/commons/req_validator';
import { JSCAddMenuList } from './jsc/JSCAddMenuList';
import { JSCUpdateMenuList } from './jsc/JSCUpdateMenuList';
import { IAddMenuList } from './interface/IAddMenuList';
import { IUpdateMenuList } from './interface/IUpdateMenuList';

const log = debug('massa:controller:menu_list');

interface ICommonResponse<DataType> {
  ok: boolean;
  data?: DataType;
  error?: string;
}
interface ICheckRequestValue<ValueType> {
  value: ValueType;
  jsonSchema: JSONSchema6;
}

export default class MenuListController {
  constructor() {
    this.findAllByOwnerId = this.findAllByOwnerId.bind(this);
    this.addMenuList = this.addMenuList.bind(this);
    this.updateMenuList = this.updateMenuList.bind(this);
  }
  /* 토큰을 검증하고 아이디를 거기서 리턴합니다. */
  private async getUserIdFromToken(token: string | undefined): Promise<ICommonResponse<{ userId: string }>> {
    if (!token) {
      return { ok: false, error: '토큰이 존재하지 않습니다.' };
    }
    try {
      const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
      return { ok: true, data: { userId: decodedIdToken.uid } };
    } catch (error) {
      log('token 검증 에러');
      log(error);
      return { ok: false, error: '토큰 검증에 실패했습니다.' };
    }
  }
  /* 요청으로 보낸 값을 검증합니다. */
  private checkRequestValue<ValueType>({
    value,
    jsonSchema,
  }: ICheckRequestValue<ValueType>): ICommonResponse<ValueType> {
    const validateReq = validateParamWithData<ValueType>(value, jsonSchema);
    if (validateReq.result === false) {
      return { ok: false, error: validateReq.errorMessage };
    }
    return { ok: true, data: validateReq.data };
  }
  async findAllByOwnerId(req: Request, res: Response) {
    const token = req.headers.authorization;
    const { ok, data, error } = await this.getUserIdFromToken(token);
    if (!ok) {
      return res.status(401).json({ text: error });
    }
    try {
      const result = await MenuListModel.findAllByOwnerId({ ownerId: data?.userId! });
      res.status(200).json(result);
    } catch (error) {
      log('findAll error');
      return res.status(500).json({ text: '에러가 발생했습니다.' });
    }
  }

  async addMenuList(req: Request, res: Response) {
    const token = req.headers.authorization;
    const { ok, data, error } = await this.getUserIdFromToken(token);
    if (!ok) {
      return res.status(401).json({ text: error });
    }
    const validateReq = this.checkRequestValue<IAddMenuList>({ value: { body: req.body }, jsonSchema: JSCAddMenuList });
    if (!validateReq.ok) {
      return res.status(401).json({ text: validateReq.error });
    }
    try {
      const result = await MenuListModel.add({
        ...req.body,
        ownerId: data?.userId,
      });
      return res.status(201).json(result);
    } catch (error) {
      log('addMenuList error');
      log(error);
      return res.status(500).json({ text: '에러가 발생했습니다.' });
    }
  }

  async updateMenuList(req: Request, res: Response) {
    const token = req.headers.authorization;
    const { ok, data, error } = await this.getUserIdFromToken(token);
    if (!ok) {
      return res.status(401).json({ text: error });
    }
    // "'menuListId' 속성이 '{ [key: string]: string | string[]; }' 형식에 없지만 '{ menuListId: string; }' 형식에서 필수입니다." 라는
    // 에러를 방지하고자 req.query 로 불러오는 대신 따로 선언합니다.
    const { menuListId } = req.query as { menuListId: string };
    const validateReq = this.checkRequestValue<IUpdateMenuList>({
      value: {
        params: { menuListId },
        body: req.body,
      },
      jsonSchema: JSCUpdateMenuList,
    });
    if (!validateReq.ok) {
      return res.status(401).json({ text: validateReq.error });
    }
    try {
      const existMenuList = await MenuListModel.find({ menuListId });
      if (existMenuList.ownerId !== data?.userId) {
        return res.status(401).json({ text: '오직 작성자만 수정하실 수 있습니다.' });
      }
      const result = await MenuListModel.update({
        ownerId: data.userId,
        id: menuListId,
        ...req.body,
      });
      return res.status(200).json(result);
    } catch (error) {
      log('updateMenuList error');
      log(error);
      return res.status(500).json({ text: '에러가 발생했습니다.' });
    }
  }
}

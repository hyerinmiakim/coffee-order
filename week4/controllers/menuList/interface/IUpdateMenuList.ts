import { IBeverage } from '../../../models/interface/IEvent';

export interface IUpdateMenuListReq {
  params: { menuListId: string };
  body: { title?: string; desc?: string; menu?: IBeverage[] };
}

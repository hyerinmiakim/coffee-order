import { IBeverage } from '@/models/interface/IEvent';

export interface IUpdateMenuList {
  params: { menuListId: string };
  body: { title?: string; desc?: string; menu?: IBeverage[] };
}

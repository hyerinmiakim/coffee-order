import { IBeverage } from '@/models/interface/IEvent';
import { IMenuListItem } from '@/models/interface/IMenuListItem';

export interface IAddMenuList {
  body: Pick<IMenuListItem, 'title' | 'desc' | 'menu'>;
}

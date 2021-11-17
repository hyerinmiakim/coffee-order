import { IMenuListItem } from '@/models/interface/IMenuListItem';

export interface IAddMenuListReq {
  body: Pick<IMenuListItem, 'title' | 'desc' | 'menu'>;
}

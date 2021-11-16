import { IBeverage } from '@/models/interface/IEvent';

export interface IAddMenuList {
  body: {
    title: string;
    desc?: string;
    menu: IBeverage[];
  };
}

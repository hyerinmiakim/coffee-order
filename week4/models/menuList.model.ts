import FirebaseAdmin from './commons/firebase_admin.model';
import { IBeverage } from './interface/IEvent';
import { IMenuListItem } from './interface/IMenuListItem';

const COLLECTION_NAME = 'menu_list';

class MenuListType {
  private menuList: IMenuListItem[];

  private MenuListStore;

  constructor() {
    this.menuList = [];
    this.MenuListStore = FirebaseAdmin.getInstance().Firestore.collection(COLLECTION_NAME);
  }

  MenuListDoc(menuListId: string) {
    return this.MenuListStore.doc(menuListId);
  }

  /** 특정 사용자의 메뉴판 목록 조회  */
  async findAllByOwnerId({ ownerId }: { ownerId: string }) {
    if (this.menuList.length > 0) {
      return this.menuList.filter((fv) => fv.ownerId === ownerId);
    }
    const snaps = await this.MenuListStore.where('ownerId', '==', ownerId).get();
    const data = snaps.docs.map((mv) => {
      const returnData = {
        ...mv.data(),
        id: mv.id,
      } as IMenuListItem;
      return returnData;
    });
    return data;
  }

  async find({ menuListId }: { menuListId: string }): Promise<IMenuListItem> {
    if (this.menuList.length > 0) {
      const findData = this.menuList.find((fv) => fv.id === menuListId);
      if (findData !== undefined) return findData;
    }
    const doc = await this.MenuListDoc(menuListId).get();
    return {
      ...doc.data(),
      id: doc.id,
    } as IMenuListItem;
  }

  async add({ title, desc, ownerId, menu }: Omit<IMenuListItem, 'id'>): Promise<IMenuListItem> {
    const addData: Omit<IMenuListItem, 'id'> = {
      title,
      ownerId,
      menu,
    };
    if (desc !== undefined) {
      addData.desc = desc;
    }
    // 추가
    const result = await this.MenuListStore.add(addData);
    return {
      id: result.id,
      title,
      desc,
      ownerId,
      menu,
    };
  }

  async update({
    ownerId,
    id,
    title,
    desc,
    menu,
  }: {
    ownerId: string;
    id: string;
    title?: string;
    desc?: string;
    menu?: IBeverage[];
  }) {
    const docRef = this.MenuListDoc(id);

    await FirebaseAdmin.getInstance().Firestore.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      // TODO: 이부분에 어떤 코드가 들어가야할까요?

      /* 1. 문서가 존재하는지 확인 */
      if(doc.exists === false){
        throw new Error('not exist menu list');
      }
      /* 2. 문서의 ownerId 와 사용자 id가 같은지 확인 */
      const docData = doc.data() as IMenuListItem;
      if(docData.ownerId !== ownerId){
        throw new Error('You dont\'t have access to this menu list');
      }
      /* 3. title, menu 가 존재한다면 해당 값을 반영하여 업데이트 */
      if(title===undefined && menu===undefined){
        throw new Error('Please put title & menu');
      }

      await transaction.update(docRef, {
        title, menu,
      });
    });
  }

  async delete({ menuListId }: { menuListId: string }) {
    await this.MenuListDoc(menuListId).delete();
  }
}

export const MenuListModel = new MenuListType();

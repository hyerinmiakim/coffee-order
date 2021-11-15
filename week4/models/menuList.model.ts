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
      /* 1. 데이터가 존재하는지 확인합니다. */
      if (!doc.exists) {
        throw new Error('존재하지 않는 메뉴 리스트입니다.');
      }
      /* 2. 해당 데이터의 작성자가 로그인한 유저와 일치하는지 확인합니다. */
      const menuListFromDoc = doc.data() as IMenuListItem;
      if (menuListFromDoc.ownerId !== ownerId) {
        throw new Error('작성자만 수정할 수 있습니다.');
      }
      /* 3. 값을 업데이트합니다. */
      const updateValue = {};
      // undefined 가 아닌지 확인 후, 존재한다면 객체에 넣어 업데이트에 활용합니다.
      if (title !== undefined) Object.assign(updateValue, { title });
      if (desc !== undefined) Object.assign(updateValue, { desc });
      if (menu !== undefined) Object.assign(updateValue, { menu });

      transaction.set(docRef, updateValue);

      // this.menuList 의 내용을 갱신합니다.
      this.menuList = this.menuList.map((val) => {
        if (val.id === id) {
          return { ...val, ...updateValue };
        }
        return val;
      });
      return;
    });
    return;
  }

  async delete({ menuListId }: { menuListId: string }) {
    await this.MenuListDoc(menuListId).delete();
  }
}

export const MenuListModel = new MenuListType();

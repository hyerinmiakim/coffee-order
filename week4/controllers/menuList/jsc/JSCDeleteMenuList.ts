import { JSONSchema6 } from 'json-schema';

export const JSCDeleteMenuList: JSONSchema6 = {
  properties: {
    params: {
      properties: {
        menuListId: {
          type: 'string',
        },
      },
      required: ['menuListId'],
    },
  },
  required: ['params'],
  type: 'object',
};

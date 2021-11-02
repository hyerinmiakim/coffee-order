import { JSONSchema6 } from 'json-schema';

export const JSCFindEvent: JSONSchema6 = {
  properties: {
    params: {
      properties: {
        eventId: {
          type: 'string',
        },
        test: {
          type: 'number',
        },
      },
      required: ['eventId'],
    },
  },
  required: ['params'],
  type: 'object',
};

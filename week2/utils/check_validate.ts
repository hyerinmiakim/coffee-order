import { NextApiResponse } from 'next';

const commonReturnError = (res: NextApiResponse) => res.status(400).end();

export const checkIsValidateToken = (res: NextApiResponse, token: string): void => {
  if (token === undefined) {
    commonReturnError(res);
  }
};

export const checkIsValidateReq = (res: NextApiResponse, req: any): void => {
  if (!req.result) {
    return res.status(400).json({
      text: req.errorMessage,
    });
  }
};

export const checkIsValidateDoc = (res: NextApiResponse, doc: any): void => {
  if (!doc.exists) {
    return res.status(404).end('문서가 없어요');
  }
};

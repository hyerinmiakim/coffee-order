/* eslint-disable prettier/prettier */
import {NextApiRequest, NextApiResponse} from 'next';
import validateParamWithData from "@/models/commons/req_validator";
import {IFindEventReq} from "@/controllers/event/interface/IFindEventReq";
import {JSCFindEvent} from "@/controllers/event/jsc/JSCFindEvent";
import FirebaseAdmin from "@/models/commons/firebase_admin.model";
import {JSCUpdateEvent} from "@/controllers/event/jsc/JSCUpdateEvent";
import {IEvent} from "@/models/interface/IEvent";
import {IUpdateEventReq} from "@/controllers/event/interface/IUpdateEventReq";


export default async function handle(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    // eslint-disable-next-line no-console
    const {method} = req;

    const supportMethod = ['PUT', 'GET'];
    if (supportMethod.indexOf(method!) === -1) {
        return res.status(400).end();
    }

    const validateReq = validate(method,req,res);

    switch (method) {
        case 'GET' :
            get(res,validateReq);
            break;

        case 'PUT' :
            put(req, res,validateReq)
            break;

        default :
             res.status(404).json({
                text: '요청 URL 오류(Not Found)',
            });
            break;
    }
}

async function get(res: NextApiResponse<any>,validateReq:any) {

    const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(validateReq.data.params.eventId);
    const doc = await ref.get();
    // 문서가 존재하지않는가?
    if (!doc.exists) {
        res.status(404).end();
        return;
    }

    const returnValue = {
        ...doc.data(),
        id: validateReq.data.params.eventId,
    };

    res.json(returnValue);
}

async function put(req: NextApiRequest, res: NextApiResponse<any>,validateReq:any) {

    // 코드 복사 후 IUpdateEventReq, JSCUpdateEvent 2가지는 import 시켜야합니다.
    const token = req.headers.authorization;
    if (token === undefined) {
        return res.status(400).end();
    }

    let userId = '';
    try {
        const decodedIdToken = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
        userId = decodedIdToken.uid;
    } catch (err) {
        return res.status(400).end();
    }

    const ref = FirebaseAdmin.getInstance().Firestore.collection('events').doc(validateReq.data.params.eventId);
    const doc = await ref.get();

    // 문서가 존재하지않는가?
    if (!doc.exists) {
        res.status(404).end();
    }

    const eventInfo = doc.data() as IEvent; // doc.data() 결과를 IEvent 인터페이스로 캐스팅
    if (eventInfo.ownerId !== userId) {
        return res.status(401).json({
            text: '이벤트 수정 권한이 없습니다',
        });
    }

    // 업데이트할 값
    const updateData = {
        ...eventInfo,
        ...validateReq.data.body,
    };

    // 문서에 변경할 값을 넣어줍니다.
    await ref.update(updateData);

    res.json(updateData);
}

function validate(method: string | undefined, req: NextApiRequest,res:NextApiResponse){
    let validateReq :any;

    switch (method) {
        case 'GET' :
            validateReq = validateParamWithData<IFindEventReq>(
                {
                    params: req.query as any,
                },
                JSCFindEvent,
            );
            break;

        case 'PUT' :
            validateReq = validateParamWithData<IUpdateEventReq>(
                {
                    params: req.query as any,
                    body: req.body,
                },
                JSCUpdateEvent,
            );
            break;

        default :
            break;
    }

    if (!validateReq.result) {
        return res.status(400).json({
            text: validateReq.errorMessage,
        });
    }

    return validateReq;
}
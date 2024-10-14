//import { IResult } from './IResult';

// export interface IResult {
//     statusCode: number;
//     message: string;
//     object?: any;
// }

export class Results {
    statusCode: number;
    message: string;
    object?: any;

    private constructor(statusCode: number, message: string);
    private constructor(statusCode: number, obj: any);
    private constructor(statusCode: number, param: string | any) {
        this.statusCode = statusCode;
        if (typeof param === 'string') {
            this.message = param;
            this.object = null;
        } else {
            this.message = '';
            this.object = param;
        }
    }

    static NotFound(message: string = "Not Found"): Results {
        return new Results(404, message);
    }

    static BadRequest(message: string = "Bad Request"): Results {
        return new Results(400, message);
    }

    static Ok(obj: any = null): Results {
        return new Results(200, obj);
    }
}
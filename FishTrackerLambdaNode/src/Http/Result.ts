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

    static Forbidden(message: string = "Forbidden"): Results {
        return new Results(403, message);
    }

    static Gone(message: string = "Gone"): Results {
        return new Results(410, message);
    }

    static PayloadTooLarge(message: string = "Payload Too Large"): Results {
        return new Results(413, message);
    }

    static TooManyRequests(message: string = "Too Many Requests"): Results {
        return new Results(429, message);
    }

    static InternalServerError(message: string = "Internal Server Error"): Results {
        return new Results(500, message);
    }

    static StatusCode(code: number, message: string = ""): Results {
        return new Results(code, message);
    }
}
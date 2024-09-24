import { Results } from '../Http/Result';

export class HttpWrapper<T> {
    private m_canContinue: boolean = false;
    private m_httpCode: Results | null = Results.NotFound();
    private m_value: T | null;

    constructor(initial: T | null);
    constructor(result: Results);
    constructor(arg: T | Results | null) {
        if (arg instanceof Results) {
            this.m_httpCode = arg;
            this.m_canContinue = false;
            this.m_value = null;
        } else {
            this.m_value = arg;
            this.m_canContinue = true;
            this.m_httpCode = null;
        }
    }

    cloneFailed<R>(): HttpWrapper<R> {
        return new HttpWrapper<R>(this.result);
    }

    static get NotFound(): HttpWrapper<any> {
        return new HttpWrapper<any>(Results.NotFound());
    }

    static Ok<T>(value: T | null): HttpWrapper<T> {
        return new HttpWrapper<T>(value);
    }

    static FromResult<T>(result: Results): HttpWrapper<T> {
        return new HttpWrapper<T>(result);
    }

    get continue(): boolean {
        return this.m_canContinue;
    }

    get result(): Results {
        return this.m_httpCode ?? Results.Ok(this.m_value);
    }

    get value(): T | null {
        return this.m_value;
    }

    //====================================================================================================
    ValidateInput(validator: (value: T) => any): HttpWrapper<T> {
        if (!this.continue) {
            return this.cloneFailed<T>();
        }

        if (this.value === null) {
            throw new Error("Validating null value");
        }

        const res = validator(this.value);
        return res === null ? HttpWrapper.Ok(this.value) : HttpWrapper.FromResult(res);
    }

    async ValidateInputAsync(validator: (value: T) => Promise<any>): Promise<HttpWrapper<T>> {
        if (!this.continue) {
            return this.cloneFailed<T>();
        }

        if (this.value === null) {
            throw new Error("Validating null value");
        }

        const res = await validator(this.value);
        return res === null ? HttpWrapper.Ok(this.value) : HttpWrapper.FromResult(res);
    }

    static Init<T>(value: T): HttpWrapper<T> {
        return HttpWrapper.Ok(value);
    }

    static async InitAsync<T>(record: Promise<HttpWrapper<T>>): Promise<HttpWrapper<T>> {
        return record;
    }

    static async InitWithRecord<R>(value: R): Promise<HttpWrapper<R>> {
        return HttpWrapper.Ok(value);
    }

    Set<R>(value: R): HttpWrapper<R> {
        return HttpWrapper.Ok(value);
    }

    async MapAsync<R>(mapper: (value: T) => Promise<HttpWrapper<R>>): Promise<HttpWrapper<R>> {
        if (!this.continue) {
            return this.cloneFailed<R>();
        }

        if (this.value === null) {
            throw new Error("Mapping null value");
        }

        const retval = await mapper(this.value);
        return retval;
    }

    Map<R>(mapper: (value: T) => R): HttpWrapper<R> {
        if (!this.continue) {
            return this.cloneFailed<R>();
        }

        if (this.value === null || this.value === undefined) {
            throw new Error("Mapping null value");
        }

        const retval = mapper(this.value);
        return HttpWrapper.Ok(retval);
    }

    async MapEachAsync<R>(mapper: (value: T) => Promise<HttpWrapper<R>>): Promise<HttpWrapper<R[]>> {
        if (!this.continue) {
            return this.cloneFailed<R[]>();
        }

        if (this.value === null || !Array.isArray(this.value)) {
            throw new Error("Mapping null value or value is not an array");
        }

        const mappedValues = await Promise.all(this.value.map(mapper));

        const failed = mappedValues.filter(f => !f.continue).map(s => s.result);
        const success = mappedValues.filter(f => f.continue && f.value !== null).map(s => s.value!);

        return failed.length > 0 ? HttpWrapper.FromResult(failed[0]) : HttpWrapper.Ok(success);
    }

    OnResult<T>(result: number, mapper: () => T): HttpWrapper<T> {
        if (this.continue || this.result.statusCode !== result) {
            return this as any as HttpWrapper<T>;
        }

        return new HttpWrapper(mapper());
    }

    async OnResultAsync<T>(result: number, mapper: () => Promise<HttpWrapper<T>>): Promise<HttpWrapper<T>> {
        if (this.continue == true || this.result.statusCode != result) {
            return this as any as HttpWrapper<T>;
        }

        return await mapper();
    }
    //====================================================================================================    
}
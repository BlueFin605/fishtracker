import { HttpWrapper } from './HttpWrapper';
import { Results } from '../Http/Result';

export class Function {
    static async ValidateInput(result: () => Results | null): Promise<HttpWrapper<object>> {
        const res = result();
        return res === null ? HttpWrapper.Ok({}) : HttpWrapper.FromResult(res);
    }

    static async ValidateInputAsync(record: Promise<HttpWrapper<object>>, result: () => Results | null): Promise<HttpWrapper<object>> {
        return Function.ValidateInput(result);
    }

    static async Init<T>(value: T): Promise<HttpWrapper<T>> {
        return HttpWrapper.Ok(value);
    }

    static async InitAsync<T>(record: Promise<HttpWrapper<T>>): Promise<HttpWrapper<T>> {
        return record;
    }

    static async InitWithRecord<T, R>(record: Promise<HttpWrapper<T>>, value: R): Promise<HttpWrapper<R>> {
        return HttpWrapper.Ok(value);
    }

    static async MapAsync<T, R>(record: Promise<HttpWrapper<T>>, mapper: (value: T) => Promise<HttpWrapper<R>>): Promise<HttpWrapper<R>> {
        const waitedRec = await record;

        if (!waitedRec.continue) {
            return waitedRec.cloneFailed<R>();
        }

        const value = waitedRec.value;

        if (value === null) {
            throw new Error("Mapping null value");
        }

        return await mapper(value);
    }

    static async MapEachAsync<T, R>(record: Promise<HttpWrapper<T[]>>, mapper: (value: T) => Promise<HttpWrapper<R>>): Promise<HttpWrapper<R[]>> {
        const waitedRec = await record;

        if (!waitedRec.continue) {
            return waitedRec.cloneFailed<R[]>();
        }

        const values = waitedRec.value;

        if (values === null) {
            throw new Error("Mapping null value");
        }

        const mappedValues = await Promise.all(values.map(mapper));

        const failed = mappedValues.filter(f => !f.continue).map(s => s.result);
        const success = mappedValues.filter(f => f.continue && f.value !== null).map(s => s.value!);

        return failed.length > 0 ? HttpWrapper.FromResult(failed[0]) : HttpWrapper.Ok(success);
    }

    static async Map<T, R>(record: Promise<HttpWrapper<T>>, mapper: (value: T) => R): Promise<HttpWrapper<R>> {
        const waitedRec = await record;

        if (!waitedRec.continue) {
            return waitedRec.cloneFailed<R>();
        }

        const value = waitedRec.value;

        if (value === null) {
            throw new Error("Mapping null value");
        }

        return HttpWrapper.Ok(mapper(value));
    }

    static async OnResult<T>(record: Promise<HttpWrapper<T>>, result: number, mapper: () => T): Promise<HttpWrapper<T>> {
        const waitedRec = await record;

        if (waitedRec.continue || waitedRec.result.statusCode !== result) {
            return waitedRec;
        }

        return HttpWrapper.Ok(mapper());
    }

    static async OnResultAsync<T>(record: Promise<HttpWrapper<T>>, result: number, mapper: () => Promise<HttpWrapper<T>>): Promise<HttpWrapper<T>> {
        const waitedRec = await record;

        if (waitedRec.continue) {
            return waitedRec;
        }

        return await mapper();
    }
}
export class Wrapper<T> {
    private m_valid: boolean = false;
    private m_value: T | null;

    constructor();
    constructor(initial: T);
    constructor(initial: T, valid: boolean);
    constructor(initial?: T, valid?: boolean) {
        if (initial !== undefined && valid !== undefined) {
            this.m_value = initial;
            this.m_valid = valid;
        } else if (initial !== undefined) {
            this.m_value = initial;
            this.m_valid = initial !== null;
        } else {
            this.m_value = null;
            this.m_valid = false;
        }
    }

    static explicit<T>(value: T): Wrapper<T> {
        return new Wrapper<T>(value);
    }

    get isOk(): boolean {
        return this.m_valid;
    }
}
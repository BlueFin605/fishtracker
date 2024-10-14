// import { Transform } from 'class-transformer';

export function EnumToString<T extends object>(enumType: T, value: T[keyof T] | undefined): string | undefined {
    if (!value) {
        return undefined;
    }

    if (typeof value === 'string') {
        console.log('EnumToString converting[',value, '][',typeof value ,'] to [', value, ']');
        return value;
    }

    const result =  Object.keys(enumType).find(key => (enumType as any)[key] === value);
    console.log('EnumToString converting[',value, '][',typeof value ,'] to [', result, ']');
    return result;
}

export function StringToEnum<T>(enumType: T, value: string | undefined): T[keyof T] | undefined {
    if (!value) {
        return undefined;
    }
    
    const result = (enumType as any)[value as keyof T];
    console.log('StringToEnum converting[',value, '] to [', result, ']');
    return result;
}
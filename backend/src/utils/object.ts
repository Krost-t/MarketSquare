type StripUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
    [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

const stripUndefined = <T extends object>(obj: T): StripUndefined<T> => {
    return Object.fromEntries(
        Object.entries(obj).filter(([, value]) => value !== undefined)
    ) as StripUndefined<T>;
};

export { stripUndefined };
export type { StripUndefined };

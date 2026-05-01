import { Dependency } from "async-reactivity";
import Query from "./Query.js";

export interface PropertyPathPart {
    type: 'property' | 'function';
    name?: string;
    arguments?: (string | number | boolean | null)[];
}

export interface Input {
    target: PropertyPathPart[],
    value: string | number | boolean | null;
}

const proxyPath = Symbol('proxyPath');

export const serialize = async <T1, T2>(func: (proxy: T2) => Promise<Dependency<Promise<T1>>>) => {
    const inputs: Input[] = [];

    const createProxy = (path: PropertyPathPart[] = []) => {
        return new Proxy((...args: any[]) => {
            const p: PropertyPathPart[] = path.concat({ type: 'function', arguments: args });
            return createProxy(p);
        }, {
            get(_target, prop) {
                if (prop === proxyPath) {
                    return path;
                }

                if (typeof prop === 'symbol') {
                    throw new Error('Symbol properties are not supported');
                }

                if (prop === 'then') {
                    return undefined;
                }

                const p: PropertyPathPart[] = path.concat({ type: 'property', name: prop });
                return createProxy(p);
            },
            set(_target, prop, value) {
                if (typeof prop === 'symbol') {
                    throw new Error('Symbol properties are not supported');
                }

                inputs.push({
                    target: path.concat({ type: 'property', name: prop }),
                    value
                });

                return true;
            }
        });
    };

    const output = await func(createProxy() as unknown as T2);
    return {
        inputs,
        output: (output as any)[proxyPath] as PropertyPathPart[],
    };
};

// maybe it is smarter to whitelist instead of blacklist
const restrictedProperties = new Set();
for (const obj of [1, 1n, true, '', Symbol(), [], {}, function () { }, async function () { }, function* () { }, async function* () { }, Date(), RegExp(''), new Map(), new Set(), new WeakMap(), new WeakSet(), Promise.resolve(), new Error()]) {
    const proto = Object.getPrototypeOf(obj);
    for (const key of Reflect.ownKeys(proto)) {
        try {
            restrictedProperties.add(proto[key]);
        } catch { }
    }
}

export const getQueryProperty = async (query: Query, path: PropertyPathPart[]) => {
    let lastTarget: any = undefined;
    let target: any = query;
    for (const part of path) {
        if (part.type === 'property') {
            lastTarget = target;
            target = await target[part.name!];
            if (restrictedProperties.has(target)) {
                target = undefined;
            }
        } else if (part.type === 'function') {
            target = await (target as Function).call(lastTarget, ...part.arguments!);
            lastTarget = undefined;
        }
    }
    return target;
};
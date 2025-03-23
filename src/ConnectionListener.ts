import { Dependency, AsyncListener } from "async-reactivity";
import { PropertyPathPart } from "./Connection.js";
import LiveQuery from "./LiveQuery.js";

const proxyPath = Symbol('proxyPath');

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
        set(_target) {
            throw new Error('setters are not supported');
        }
    });
};

export default class ConnectionListener<T1, T2 extends LiveQuery> extends AsyncListener<T1> {
    constructor(liveQuery: T2, func: (proxy: T2) => Promise<Dependency<Promise<T1>>>) {
        const pathPromise = func(createProxy() as unknown as T2)
            .then(output => (output as any)[proxyPath]);
        super(
            async () => liveQuery.connection.watch(liveQuery, await pathPromise),
            async () => liveQuery.connection.unwatch(liveQuery, await pathPromise),
        );
    }
}
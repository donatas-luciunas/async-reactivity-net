import { Dependency, AsyncListener } from "async-reactivity";
import { LiveQuery } from "./LiveQuery.js";
import { serialize } from "./PathSerializer.js";

export default class ConnectionListener<T1, T2 extends LiveQuery> extends AsyncListener<T1> {
    constructor(liveQuery: T2, func: (proxy: T2) => Promise<Dependency<Promise<T1>>>) {
        const pathPromise = serialize(func);
        super(
            async () => liveQuery.connection.watch(liveQuery, (await pathPromise).output),
            async () => liveQuery.connection.unwatch(liveQuery, (await pathPromise).output),
        );
    }
}
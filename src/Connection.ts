import { WebSocket, MessageEvent } from 'ws';
import { Dependency, Ref, Watcher } from 'async-reactivity';
import LiveQuery from "./LiveQuery.js";

export interface PropertyPathPart {
    type: 'property' | 'function';
    name?: string;
    arguments?: (string | number | boolean | null)[];
}

export interface Message {
    liveQuery: {
        type: string;
        id: string;
    };
    path: PropertyPathPart[];
    set?: any;
    watch?: boolean;
    unwatch?: boolean;
}

const getLiveQueryKey = (type: string, id: string) => `${type}-${id}`;

const getLiveQueryProperty = async (container: LiveQuery, path: PropertyPathPart[]) => {
    let target: any = container;
    for (const part of path) {
        if (part.type === 'property') {
            target = await target[part.name!];
        } else if (part.type === 'function') {
            target = await target(...part.arguments!);
        }
    }
    return target;
};

type LiveQueryConstructor = new (connection: Connection, id?: string) => LiveQuery;

export default class Connection {
    private socket: WebSocket;
    private liveQueryTypes: Map<string, LiveQueryConstructor>;
    private liveQueries = new Map<string, LiveQuery>();
    private watchers = new Map<Dependency<any>, Watcher<any>>();

    constructor(socket: WebSocket, liveQueryTypes: LiveQueryConstructor[]) {
        this.socket = socket;
        this.liveQueryTypes = new Map(liveQueryTypes.map(t => [t.name, t]));
        socket.addEventListener('message', this.onMessage);
        socket.addEventListener('close', this.onClose);
    }

    private onMessage = async (event: MessageEvent) => {
        const message: Message = JSON.parse(event.data.toString());

        const liveQuery = this.getOrCreateLiveQuery(message.liveQuery);

        const property: Dependency<any> = await getLiveQueryProperty(liveQuery, message.path);

        if (message.watch) {
            if (!this.watchers.has(property)) {
                this.watchers.set(property, new Watcher(property, async (value) => {
                    this.socket.send(JSON.stringify({
                        liveQuery: {
                            type: liveQuery.constructor.name,
                            id: liveQuery.id,
                        },
                        path: message.path,
                        set: await value
                    }));
                }));
            }
        } else if (message.unwatch) {
            const w = this.watchers.get(property);
            this.watchers.delete(property);
            w?.dispose();
        } else {
            (property as Ref<any>).value = Promise.resolve(message.set);
        }
    }

    private onClose = () => {
        this[Symbol.dispose]()
    };

    private getOrCreateLiveQuery(liveQueryHead: { type: string; id: string }) {
        const key = getLiveQueryKey(liveQueryHead.type, liveQueryHead.id);
        let liveQuery = this.liveQueries.get(key);
        if (!liveQuery) {
            const type = this.liveQueryTypes.get(liveQueryHead.type)!;
            liveQuery = new type(this, liveQueryHead.id);
            this.liveQueries.set(key, liveQuery);
        }
        return liveQuery;
    }

    add(liveQuery: LiveQuery) {
        const key = getLiveQueryKey(liveQuery.constructor.name, liveQuery.id);
        this.liveQueries.set(key, liveQuery);
    }

    watch(liveQuery: LiveQuery, path: PropertyPathPart[]) {
        this.socket.send(JSON.stringify({
            liveQuery: {
                type: liveQuery.constructor.name,
                id: liveQuery.id
            },
            path,
            watch: true
        }));
    }

    unwatch(liveQuery: LiveQuery, path: PropertyPathPart[]) {
        this.socket.send(JSON.stringify({
            liveQuery: {
                type: liveQuery.constructor.name,
                id: liveQuery.id
            },
            path,
            unwatch: true
        }));
    }

    [Symbol.dispose]() {
        this.socket.removeEventListener('message', this.onMessage);
        this.socket.removeEventListener('close', this.onClose);
        for (const watcher of this.watchers.values()) {
            watcher.dispose();
        }
        for (const liveQuery of this.liveQueries.values()) {
            liveQuery[Symbol.dispose]();
        }
    }
}
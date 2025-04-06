import { WebSocket, MessageEvent } from 'ws';
import { Dependency, Ref, Watcher } from 'async-reactivity';
import { LiveQuery, LiveQueryConstructor } from "./LiveQuery.js";
import { getQueryProperty, PropertyPathPart } from '../Serializer.js';

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

interface Serializer {
    parse(text: string): any;
    stringify(value: any): string;
}

export default class Connection {
    private socket: WebSocket;
    private liveQueryTypes: Map<string, LiveQueryConstructor>;
    private liveQueries = new Map<string, LiveQuery>();
    private watchers = new Map<Dependency<any>, Watcher<any>>();

    constructor(socket: WebSocket, liveQueryTypes: LiveQueryConstructor[], private readonly serializer: Serializer = JSON) {
        this.socket = socket;
        this.liveQueryTypes = new Map(liveQueryTypes.map(t => [t.name, t]));
        socket.addEventListener('message', this.onMessage);
        socket.addEventListener('close', this.onClose);
    }

    private onMessage = async (event: MessageEvent) => {
        const message: Message = this.serializer.parse(event.data.toString());

        const liveQuery = this.getOrCreateLiveQuery(message.liveQuery);

        const property: Dependency<any> = await getQueryProperty(liveQuery, message.path);

        if (message.watch) {
            if (!this.watchers.has(property)) {
                let previousData: string;
                this.watchers.set(property, new Watcher(property, async (value) => {
                    let set;
                    try {
                        set = {
                            type: 'resolve',
                            value: await value
                        };
                    } catch (e) {
                        set = {
                            type: 'reject',
                            value: e
                        };
                    }
                    const data = this.serializer.stringify({
                        liveQuery: {
                            type: liveQuery.constructor.name,
                            id: liveQuery.id,
                        },
                        path: message.path,
                        set
                    });
                    if (data === previousData) {
                        return;
                    }
                    this.socket.send(data);
                    previousData = data;
                }));
            }
        } else if (message.unwatch) {
            const w = this.watchers.get(property);
            this.watchers.delete(property);
            w?.dispose();
        } else if (message.set) {
            (property as Ref<any>).value = message.set.type === 'resolve' ? Promise.resolve(message.set.value) : Promise.reject(message.set.value);
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
        this.socket.send(this.serializer.stringify({
            liveQuery: {
                type: liveQuery.constructor.name,
                id: liveQuery.id
            },
            path,
            watch: true
        }));
    }

    unwatch(liveQuery: LiveQuery, path: PropertyPathPart[]) {
        this.socket.send(this.serializer.stringify({
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
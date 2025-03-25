import Connection from "./Connection.js";
import Query from "./Query.js";

export interface Live {
    readonly id: string;
    readonly connection: Connection;
}

export type LiveQuery = Query & Live;

export interface LiveQueryConstructor {
    new (connection: Connection, id?: string): LiveQuery;
}

export { v4 as newId } from 'uuid';
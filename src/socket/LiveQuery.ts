import Connection from "./Connection.js";
import Query from "../Query.js";

export type LiveQuery = Query & {
    readonly id: string;
    readonly connection: Connection;
};

export interface LiveQueryConstructor {
    new (connection: Connection, id?: string): LiveQuery;
}

export { v4 as newId } from 'uuid';
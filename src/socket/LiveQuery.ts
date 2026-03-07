import Connection from "./Connection.js";
import Query from "../Query.js";

export type LiveQuery = Query & {
    readonly id: string;
    readonly connection: Connection;
};

export type LiveQueryConstructor = (new (connection: Connection, id: string) => LiveQuery) & { type: string };

export { v4 as newId } from 'uuid';
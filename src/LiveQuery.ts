import { v4 as uuidv4 } from 'uuid';
import Connection from "./Connection.js";
import Query from "./Query.js";

export default abstract class LiveQuery extends Query {
    public readonly id: string;
    public readonly connection: Connection;

    constructor(connection: Connection, id?: string) {
        super();
        this.connection = connection;
        this.id = id ?? uuidv4();
    }
}
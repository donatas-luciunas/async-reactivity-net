import { Input, PropertyPathPart } from "../Serializer.js";
import Query from "../Query.js";

export interface FetchBody {
    type: string;
    inputs: Input[];
    output: PropertyPathPart[];
}

export type FetchQuery = Query & {
    readonly fetch: <T>(body: FetchBody, abortSignal: AbortSignal) => Promise<T>
};
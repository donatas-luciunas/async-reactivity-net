import { Input, PropertyPathPart } from "./PathSerializer.js";
import Query from "./Query.js";

export type FetchQuery = Query & {
    readonly fetch: <T>({ type, inputs, output }: { type: string, inputs: Input[], output: PropertyPathPart[] }) => Promise<T>
};

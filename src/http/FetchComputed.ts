import { Computed, ComputeFuncScoped, Dependency } from "async-reactivity";
import { serialize } from "../PathSerializer.js";
import { FetchQuery } from "./FetchQuery.js";

export default class FetchComputed<
    T1 extends FetchQuery,
    T2 extends TBase,
    TBase = T2,
> extends Computed<Promise<T2>, Promise<TBase>> {
    constructor(
        query: T1,
        getter: ComputeFuncScoped<T1, Promise<Dependency<Promise<T2>>>>,
        isEqual?: (v1: Promise<TBase>, v2: Promise<TBase>) => boolean
    ) {
        super(async (value) => {
            const { inputs, output } = await serialize<T2, T1>(c => getter(value, c));

            return query.fetch<T2>({
                type: query.constructor.name,
                inputs,
                output
            });
        }, isEqual);
    }
}
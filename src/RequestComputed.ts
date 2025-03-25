import { Computed, ComputeFuncScoped, Dependency } from "async-reactivity";
import Query from "./Query.js";
import { serialize } from "./PathSerializer";

export default class RequestComputed<
    T1 extends Query,
    T2 extends TBase,
    TBase = T2,
> extends Computed<Promise<Dependency<Promise<T2>>>, Promise<Dependency<Promise<TBase>>>> {
    constructor(
        getter: ComputeFuncScoped<T1, Promise<Dependency<Promise<T2>>>>,
        isEqual?: (v1: Promise<Dependency<Promise<TBase>>>, v2: Promise<Dependency<Promise<TBase>>>) => boolean
    ) {
        super(async (value, previousValue) => {
            const { inputs, output } = await serialize<T2, T1>(c => getter(value, c, previousValue));

            // todo: fetch
            const url = new URL('/business-logic', document.location.toString());
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs,
                    output
                })
            });
            const result = await response.json();
            return result;
        }, isEqual);
    }
}
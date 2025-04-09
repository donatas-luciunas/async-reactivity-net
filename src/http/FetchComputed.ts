import { Computed, Dependency, TrackValue } from "async-reactivity";
import { serialize } from "../Serializer.js";
import { FetchQuery } from "./FetchQuery.js";

export default class FetchComputed<T1, T2 extends FetchQuery> extends Computed<Promise<T1>> {
    constructor(
        query: T2,
        getter: (value: TrackValue, scope: T2) => Promise<Dependency<Promise<T1>>>,
        isEqual?: (v1: Promise<T1>, v2: Promise<T1>) => boolean
    ) {
        super(async (value, _previousValue, abortSignal) => {
            const { inputs, output } = await serialize<T1, T2>(c => getter(value, c));

            return query.fetch<T1>({
                type: query.constructor.name,
                inputs,
                output
            }, abortSignal);
        }, isEqual);
    }
}
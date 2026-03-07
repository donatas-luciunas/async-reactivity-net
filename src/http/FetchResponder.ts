import { QueryConstructor } from "../Query.js";
import { getQueryProperty } from "../Serializer.js";
import { FetchBody } from "./FetchQuery.js";

export default class FetchResponder {
    private queryTypes: Map<string, QueryConstructor>;

    constructor(queryTypes: QueryConstructor[]) {
        this.queryTypes = new Map(queryTypes.map(t => [t.type, t]));
    }

    async run(body: FetchBody) {
        const type = this.queryTypes.get(body.type)!;
        const query = new type();

        for (const input of body.inputs) {
            {
                const lastPathPart = input.target.pop();
                if (lastPathPart?.type !== 'property' || lastPathPart?.name !== 'value') {
                    throw new Error('Last path part must be property "value"');
                }
            }

            const target = await getQueryProperty(query, input.target);
            target.value = input.value;
        }

        const target = await getQueryProperty(query, body.output);
        const result = await target.value;

        query[Symbol.dispose]();

        return result;
    }
}
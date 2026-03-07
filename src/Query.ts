import { Dependent } from "async-reactivity";

export default abstract class Query {
    static readonly type: string;

    private dependents: Dependent[] = [];

    protected register = <T extends Dependent>(d: T): T => {
        this.dependents.push(d);
        return d;
    };

    [Symbol.dispose]() {
        for (const d of this.dependents) {
            d.dispose();
        }
    }
}

export type QueryConstructor = (new () => Query) & { type: string };
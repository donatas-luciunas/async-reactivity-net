import { Computed, Dependent, Ref } from "async-reactivity";

export default abstract class Query {
    static readonly type: string;

    private allowedFunctions = new Set<Function>([
        Object.getOwnPropertyDescriptor(Ref.prototype, 'value')!.get!,
        Object.getOwnPropertyDescriptor(Computed.prototype, 'value')!.get!
    ]);

    constructor(allowedPropertyDescriptors: PropertyDescriptor[] = []) {
        for (const d of allowedPropertyDescriptors) {
            this.allowedFunctions.add(d.value ?? d.get);
        }
    }

    public isAllowed(d: PropertyDescriptor) {
        return this.allowedFunctions.has(d.value ?? d.get);
    }

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
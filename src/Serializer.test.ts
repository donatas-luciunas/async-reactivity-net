import 'mocha';
import assert from 'assert';
import { Computed, Listener, Ref } from 'async-reactivity';

import { getQueryProperty, PropertyPathPart } from './Serializer.js';
import Query from './Query.js';

class Data {
    a = 5;
    b = [5, 10];
    c(a: number) {
        return a * 2;
    }
    d(a: number) {
        return a * this.a;
    }
    async e(a: number) {
        return a * 3;
    }
    f = new Ref(12);
    g = new Computed(() => 25);
    h = new Listener(32, () => {}, () => {});
}

class MyQuery extends Query {
    static readonly type = 'MyQuery';

    constructor() {
        super([
            Object.getOwnPropertyDescriptor(Data.prototype, 'c')!,
            Object.getOwnPropertyDescriptor(Data.prototype, 'd')!,
            Object.getOwnPropertyDescriptor(Data.prototype, 'e')!,
        ]);
    }

    data = new Data();
}

describe('getQueryProperty', function () {

    describe('get', async function () {
        it('property - number', async function () {
            const q = new MyQuery();

            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'data'
            }, {
                type: 'property',
                name: 'a'
            }];

            const result = await getQueryProperty(q, path);

            assert.strictEqual(result, 5);
        });

        it('property - array', async function () {
            const q = new MyQuery();

            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'data'
            }, {
                type: 'property',
                name: 'b'
            }];

            const result = await getQueryProperty(q, path);

            assert.deepStrictEqual(result, [5, 10]);
        });

        it('function', async function () {
            const q = new MyQuery();

            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'data'
            }, {
                type: 'property',
                name: 'c'
            }, {
                type: 'function',
                arguments: [2]
            }];

            const result = await getQueryProperty(q, path);

            assert.strictEqual(result, 4);
        });

        it('function this', async function () {
            const q = new MyQuery();

            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'data'
            }, {
                type: 'property',
                name: 'd'
            }, {
                type: 'function',
                arguments: [2]
            }];

            const result = await getQueryProperty(q, path);

            assert.strictEqual(result, 10);
        });

        it('async function', async function () {
            const q = new MyQuery();

            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'data'
            }, {
                type: 'property',
                name: 'e'
            }, {
                type: 'function',
                arguments: [2]
            }];

            const result = await getQueryProperty(q, path);

            assert.strictEqual(result, 6);
        });

        it('ref', async function () {
            const q = new MyQuery();

            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'data'
            }, {
                type: 'property',
                name: 'f'
            }, {
                type: 'property',
                name: 'value'
            }];

            const result = await getQueryProperty(q, path);

            assert.strictEqual(result, 12);
        });

        it('computed', async function () {
            const q = new MyQuery();

            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'data'
            }, {
                type: 'property',
                name: 'g'
            }, {
                type: 'property',
                name: 'value'
            }];

            const result = await getQueryProperty(q, path);

            assert.strictEqual(result, 25);
        });

        it('listener', async function () {
            const q = new MyQuery();
            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'data'
            }, {
                type: 'property',
                name: 'h'
            }, {
                type: 'property',
                name: 'value'
            }];

            const result = await getQueryProperty(q, path);

            assert.strictEqual(result, 32);
        });
    });

    describe('private', function () {

        it('type', async function () {
            const q = new MyQuery();
            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'type'
            }];

            let result;
            try {
                result = await getQueryProperty(q, path);
            } catch { }

            assert.strictEqual(result, undefined);
        });

        it('allowedFunctions', async function () {
            const q = new MyQuery();
            const path: PropertyPathPart[] = [{
                type: 'property',
                name: '#allowedFunctions'
            }];

            let result;
            try {
                result = await getQueryProperty(q, path);
            } catch { }

            assert.strictEqual(result, undefined);
        });

        it('isAllowed', async function () {
            const q = new MyQuery();
            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'isAllowed'
            }];

            let result;
            try {
                result = await getQueryProperty(q, path);
            } catch { }

            assert.strictEqual(result, undefined);
        });

        it('dependents', async function () {
            const q = new MyQuery();
            const path: PropertyPathPart[] = [{
                type: 'property',
                name: '#dependents'
            }];

            let result;
            try {
                result = await getQueryProperty(q, path);
            } catch { }

            assert.strictEqual(result, undefined);
        });

    });

    describe('remote script execution', async function () {
        it('object', async function () {
            const q = new MyQuery();
            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'constructor'
            }, {
                type: 'property',
                name: 'constructor'
            }, {
                type: 'function',
                arguments: ['return 5']
            }, {
                type: 'function',
                arguments: []
            }];

            let result;
            try {
                result = await getQueryProperty(q, path);
            } catch { }

            assert.strictEqual(result, undefined);
        });

        it('function', async function () {
            const q = new MyQuery();
            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'data'
            }, {
                type: 'property',
                name: 'c'
            }, {
                type: 'property',
                name: 'constructor'
            }, {
                type: 'function',
                arguments: ['return 5']
            }, {
                type: 'function',
                arguments: []
            }];

            let result;
            try {
                result = await getQueryProperty(q, path);
            } catch { }

            assert.strictEqual(result, undefined);
        });

        it('async function', async function () {
            const q = new MyQuery();
            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'data'
            }, {
                type: 'property',
                name: 'e'
            }, {
                type: 'property',
                name: 'constructor'
            }, {
                type: 'function',
                arguments: ['return 5']
            }, {
                type: 'function',
                arguments: []
            }];

            let result;
            try {
                result = await getQueryProperty(q, path);
            } catch { }

            assert.strictEqual(result, undefined);
        });
    });

    it('leak source', async function () {
        const q = new MyQuery();

        const path: PropertyPathPart[] = [{
            type: 'property',
            name: 'data',
        }, {
            type: 'property',
            name: 'c'
        }, {
            type: 'property',
            name: 'toString'
        }, {
            type: 'function',
            arguments: []
        }];

        let result;
        try {
            result = await getQueryProperty(q, path);
        } catch { }

        assert.strictEqual(result, undefined);
    });

    it('mutate', async function () {
        const q = new MyQuery();

        const path: PropertyPathPart[] = [{
            type: 'property',
            name: 'data'
        }, {
            type: 'property',
            name: 'b'
        }, {
            type: 'property',
            name: 'pop'
        }, {
            type: 'function',
            arguments: []
        }];

        try {
            await getQueryProperty(q, path);
        } catch { }

        assert.deepStrictEqual(q.data.b, [5, 10]);
    });
});
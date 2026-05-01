import 'mocha';

import { getQueryProperty, PropertyPathPart } from './Serializer.js';
import assert from 'assert';

describe('getQueryProperty', function () {

    describe('get', async function () {
        it('property - number', async function () {
            const obj = { a: 5 } as any;

            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'a'
            }];

            const result = await getQueryProperty(obj, path);

            assert.strictEqual(result, 5);
        });

        it('property - array', async function () {
            const obj = { a: [5] } as any;

            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'a'
            }];

            const result = await getQueryProperty(obj, path);

            assert.strictEqual(result?.[0], 5);
        });

        it('function', async function () {
            const obj = { a: (b: number) => b * 2 } as any;

            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'a'
            }, {
                type: 'function',
                arguments: [2]
            }];

            const result = await getQueryProperty(obj, path);

            assert.strictEqual(result, 4);
        });

        it('function this', async function () {
            class A {
                a = 5;
                f() {
                    return this.a;
                }
            }

            const obj = new A() as any;

            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'f'
            }, {
                type: 'function',
                arguments: []
            }];

            const result = await getQueryProperty(obj, path);

            assert.strictEqual(result, 5);
        });
    });

    describe('remote script execution', async function () {
        it('object', async function () {
            const obj = {} as any;
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
                result = await getQueryProperty(obj, path);
            } catch { }
            
            assert.notStrictEqual(result, 5);
        });

        it('function', async function () {
            const obj = { f: () => { } } as any;
            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'f'
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
                result = await getQueryProperty(obj, path);
            } catch { }

            assert.notStrictEqual(result, 5);
        });

        it('async function', async function () {
            const obj = { f: async () => { } } as any;
            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'f'
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
                result = await getQueryProperty(obj, path);
            } catch { }

            assert.notStrictEqual(result, 5);
        });

        it('url', async function () {
            const obj = { a: new URL('https://www.google.com') } as any;
            const path: PropertyPathPart[] = [{
                type: 'property',
                name: 'a'
            }, {
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
                result = await getQueryProperty(obj, path);
            } catch { }

            assert.notStrictEqual(result, 5);
        });
    });

    it('leak source', async function () {
        const obj = {
            f: () => { return 5 }
        };

        const path: PropertyPathPart[] = [{
            type: 'property',
            name: 'f'
        }, {
            type: 'property',
            name: 'toString'
        }, {
            type: 'function',
            arguments: []
        }];

        let result;
        try {
            result = await getQueryProperty(obj as any, path);
        } catch { }

        assert.notStrictEqual(result, obj.f.toString());
    });

    it('mutate', async function () {
        const obj = {
            a: ['5', '2']
        };

        const path: PropertyPathPart[] = [{
            type: 'property',
            name: 'a'
        }, {
            type: 'property',
            name: 'pop'
        }, {
            type: 'function',
            arguments: []
        }];

        try {
            await getQueryProperty(obj as any, path);
        } catch { }

        assert.deepStrictEqual(obj.a, ['5', '2']);
    });
});
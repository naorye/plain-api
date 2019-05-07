import axios from 'axios';
import { createResource, setDefaultInterpolationPattern } from './create-resource';

describe('Api Call Test', () => {
    [
        // GET
        {
            method: 'get',
            name: 'should perform simple GET request',
            createResource: () => createResource('get', 'http://example.com/some/api/'),
            expectedArguments: ['http://example.com/some/api/', {}],
        },
        {
            method: 'get',
            name: 'should perform GET request with params',
            createResource: () =>
                createResource('get', 'http://example.com/some/api/', {
                    inputMap: {
                        a: 'A',
                        b: 'B',
                    },
                }),
            payload: { a: 1, b: 2 },
            expectedArguments: ['http://example.com/some/api/', { params: { A: 1, B: 2 } }],
        },
        {
            method: 'get',
            name: 'should perform GET request only with provided params defined in inputMap',
            createResource: () =>
                createResource('get', 'http://example.com/some/api/', {
                    inputMap: {
                        a: 'A',
                        b: 'B',
                    },
                }),
            payload: { a: 1, c: 2 },
            expectedArguments: ['http://example.com/some/api/', { params: { A: 1 } }],
        },

        // POST
        {
            method: 'post',
            name: 'should perform simple POST request',
            createResource: () => createResource('post', 'http://example.com/some/api/'),
            expectedArguments: ['http://example.com/some/api/', undefined, {}],
        },
        {
            method: 'post',
            name: 'should perform POST request with params',
            createResource: () =>
                createResource('post', 'http://example.com/some/api/', {
                    inputMap: {
                        a: 'A',
                        b: 'B',
                    },
                }),
            payload: { a: 1, b: 2 },
            expectedArguments: ['http://example.com/some/api/', { A: 1, B: 2 }, {}],
        },
        {
            method: 'post',
            name: 'should perform POST request only with provided params defined in inputMap',
            createResource: () =>
                createResource('post', 'http://example.com/some/api/', {
                    inputMap: {
                        a: 'A',
                        b: 'B',
                    },
                }),
            payload: { a: 1, c: 2 },
            expectedArguments: ['http://example.com/some/api/', { A: 1 }, {}],
        },

        // PUT
        {
            method: 'put',
            name: 'should perform simple PUT request',
            createResource: () => createResource('put', 'http://example.com/some/api/'),
            expectedArguments: ['http://example.com/some/api/', undefined, {}],
        },
        {
            method: 'put',
            name: 'should perform PUT request with params',
            createResource: () =>
                createResource('put', 'http://example.com/some/api/', {
                    inputMap: {
                        a: 'A',
                        b: 'B',
                    },
                }),
            payload: { a: 1, b: 2 },
            expectedArguments: ['http://example.com/some/api/', { A: 1, B: 2 }, {}],
        },
        {
            method: 'put',
            name: 'should perform PUT request only with provided params defined in inputMap',
            createResource: () =>
                createResource('put', 'http://example.com/some/api/', {
                    inputMap: {
                        a: 'A',
                        b: 'B',
                    },
                }),
            payload: { a: 1, c: 2 },
            expectedArguments: ['http://example.com/some/api/', { A: 1 }, {}],
        },

        // DELETE
        {
            method: 'delete',
            name: 'should perform simple DELETE request',
            createResource: () => createResource('delete', 'http://example.com/some/api/'),
            expectedArguments: ['http://example.com/some/api/', {}],
        },
        {
            method: 'delete',
            name: 'should perform DELETE request without params, even if they were declared',
            createResource: () =>
                createResource('delete', 'http://example.com/some/api/', {
                    inputMap: {
                        a: 'A',
                        b: 'B',
                    },
                }),
            payload: { a: 1, b: 2 },
            expectedArguments: ['http://example.com/some/api/', {}],
        },

        // Misc
        {
            method: 'get',
            name: 'should support withCredentials option',
            createResource: () =>
                createResource('get', 'http://example.com/some/api/', { withCredentials: true }),
            expectedArguments: ['http://example.com/some/api/', { withCredentials: true }],
        },
        {
            method: 'get',
            name: 'should support headers option according to headersMap',
            createResource: () =>
                createResource('get', 'http://example.com/some/api/', {
                    headersMap: {
                        token: 'x-token',
                        param: 'x-param',
                    },
                }),
            payload: { token: 'myToken', unused: 'unusedValue' },
            expectedArguments: [
                'http://example.com/some/api/',
                { headers: { 'x-token': 'myToken' } },
            ],
        },
        {
            method: 'get',
            name: 'should support interpolation',
            createResource: () =>
                createResource('get', 'http://example.com/some/api/{{id1}}/{{id2}}/id3'),
            payload: { id1: '1', id2: 2, id3: 3 },
            expectedArguments: ['http://example.com/some/api/1/2/id3', {}],
        },
        {
            method: 'get',
            name: "should unchange url if interpolation parameter wasn't provided",
            createResource: () =>
                createResource('get', 'http://example.com/some/api/{{id1}}/{{id2}}/id3'),
            expectedArguments: ['http://example.com/some/api/{{id1}}/{{id2}}/id3', {}],
        },
        {
            method: 'get',
            name: 'should support custom interpolation pattern',
            createResource: () =>
                createResource('get', 'http://example.com/some/api/:id1/:id2/id3', {
                    interpolationPattern: /:(\w+)/gi,
                }),
            payload: { id1: '1', id2: 2, id3: 3 },
            expectedArguments: ['http://example.com/some/api/1/2/id3', {}],
        },
        {
            method: 'get',
            name: 'should support custom interpolation pattern via default definition',
            createResource: () => {
                setDefaultInterpolationPattern(/:(\w+)/gi);
                return createResource('get', 'http://example.com/some/api/:id1/:id2/id3');
            },
            payload: { id1: '1', id2: 2, id3: 3 },
            expectedArguments: ['http://example.com/some/api/1/2/id3', {}],
        },
        {
            method: 'get',
            name: 'should support chaining response parsers',
            createResource: () =>
                createResource('get', 'http://example.com/some/api/', {
                    parsers: [data => data.a, data => data.b, data => data.c],
                }),
            mockResponse: { data: { a: { b: { c: 2 } } } },
            expectedArguments: ['http://example.com/some/api/', {}],
            expectedResult: 2,
        },
        {
            method: 'get',
            name: 'should support transformPayload option',
            createResource: () =>
                createResource('get', 'http://example.com/some/api/', {
                    inputMap: {
                        a: 'A',
                        b: 'B',
                    },
                    transformPayload: payload => ({ ...payload, B: 3, C: 4 }),
                }),
            payload: { a: 1, B: 2 },
            expectedArguments: ['http://example.com/some/api/', { params: { A: 1, B: 3, C: 4 } }],
        },
    ].forEach(test => {
        it(test.name, async () => {
            const mock = jest
                .spyOn(axios, test.method)
                .mockImplementation(() => test.mockResponse || true);

            const resource = test.createResource();
            const result = await resource.call(test.payload);

            expect(mock).toHaveBeenCalledWith(...test.expectedArguments);

            if (test.expectedResult) {
                expect(result).toEqual(test.expectedResult);
            }

            mock.mockRestore();
        });
    });

    it('should throw and error when invalid method is used', async () => {
        let errorMessage;
        const resource = createResource('bla', 'http://example.com/some/api/');
        try {
            await resource.call();
        } catch (err) {
            errorMessage = err.message;
        }

        expect(errorMessage).toEqual('Invalid method bla');
    });
});

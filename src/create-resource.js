import axios from 'axios';

function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function invokeParsers(parsers = [], body, isFailure, payload, options, statusCode) {
    let parsersArr;
    if (!Array.isArray(parsers)) {
        parsersArr = [parsers];
    } else {
        parsersArr = parsers;
    }
    const originalBody = Object.freeze(body);
    const parsedBody = parsersArr.reduce(
        (interBody, parser) => parser(interBody, isFailure, payload, options, statusCode),
        originalBody
    );
    return parsedBody;
}

// TODO: Remove this method which is deprecated since createResourceFactory()
export function setDefaultInterpolationPattern(interpolationPattern) {
    defaultOptions.interpolationPattern = interpolationPattern;
}

const defaultOptions = {
    interpolationPattern: /\{\{(\w+)\}\}/gi,
    transformPayload: p => p,
    transformHeaders: h => h,
    inputMap: undefined,
    headersMap: undefined,
    withCredentials: false,
    parsers: [],
};

function mergeOptions(...args) {
    return args.reduce((merged, options) => {
        return {
            ...merged,
            ...options,
            parsers: options.parsers ? [...merged.parsers, ...options.parsers] : merged.parsers,
        };
    }, defaultOptions);
}

function createResourceFactory(factoryDefaults = {}) {
    return function createResource(method, apiUrl, options = {}) {
        const mergedOptions = mergeOptions(factoryDefaults, options);

        function buildUrl(urlParams = {}) {
            const { interpolationPattern } = mergedOptions;
            return apiUrl.replace(interpolationPattern, (match, p1) =>
                Object.prototype.hasOwnProperty.call(urlParams, p1)
                    ? encodeURIComponent(urlParams[p1])
                    : match
            );
        }

        function getProperties() {
            return {
                apiUrl,
                method,
                options: mergedOptions,
            };
        }

        function getTransformedPayload(payload) {
            const { inputMap, transformPayload } = mergedOptions;
            let transformedPayload;
            if (inputMap && payload) {
                transformedPayload = Object.keys(inputMap).reduce(
                    (data, key) => ({
                        ...data,
                        [inputMap[key]]: payload[key],
                    }),
                    {}
                );
            } else {
                transformedPayload = {};
            }
            transformedPayload = transformPayload(transformedPayload);
            return isEmptyObject(transformedPayload) ? undefined : transformedPayload;
        }

        function getHeaders(payload) {
            const { headersMap, transformHeaders } = mergedOptions;
            let headers;
            if (headersMap && payload) {
                headers = Object.keys(headersMap).reduce(
                    (data, key) => ({
                        ...data,
                        [headersMap[key]]: payload[key],
                    }),
                    {}
                );
            } else {
                headers = {};
            }
            headers = transformHeaders(headers);
            return isEmptyObject(headers) ? undefined : headers;
        }

        async function call(payload = undefined) {
            const fullUrl = buildUrl(payload);
            const transformedPayload = getTransformedPayload(payload);
            const headers = getHeaders(payload);

            const { withCredentials, parsers } = mergedOptions;
            const axiosOptions = {};
            if (headers) {
                axiosOptions.headers = headers;
            }
            if (withCredentials) {
                axiosOptions.withCredentials = withCredentials;
            }

            let body;
            let isFailure = false;
            let statusCode;
            try {
                let response;
                switch (method.toLowerCase()) {
                    case 'get':
                        if (transformedPayload) {
                            axiosOptions.params = transformedPayload;
                        }
                        response = await axios.get(fullUrl, axiosOptions);
                        break;
                    case 'delete':
                        response = await axios.delete(fullUrl, axiosOptions);
                        break;
                    case 'post':
                        response = await axios.post(fullUrl, transformedPayload, axiosOptions);
                        break;
                    case 'put':
                        response = await axios.put(fullUrl, transformedPayload, axiosOptions);
                        break;
                    case 'patch':
                        response = await axios.patch(fullUrl, transformedPayload, axiosOptions);
                        break;
                    default:
                        throw new Error(`Invalid method ${method}`);
                }
                body = response.data;
                statusCode = response.status;
            } catch (err) {
                isFailure = true;
                if (err.response) {
                    body = err.response.data;
                    statusCode = err.response.status;
                } else {
                    throw err;
                }
            }

            return invokeParsers(parsers, body, isFailure, payload, mergedOptions, statusCode);
        }

        return {
            buildUrl,
            call,
            getProperties,
        };
    };
}

export const createResource = createResourceFactory();
export { createResourceFactory };

import axios from 'axios';

const defaultOptions = {
    interpolationPattern: /\{\{(\w+)\}\}/gi,
    inputMap: undefined,
    headersMap: undefined,
    withCredentials: false,
    parsers: [],
};

function invokeParsers(parsers = [], body, isFailure, payload, options) {
    let parsersArr;
    if (!Array.isArray(parsers)) {
        parsersArr = [parsers];
    } else {
        parsersArr = parsers;
    }
    const originalBody = Object.freeze(body);
    const parsedBody = parsersArr.reduce(
        (interBody, parser) => parser(interBody, isFailure, payload, options),
        originalBody
    );
    return parsedBody;
}

export function setDefaultInterpolationPattern(interpolationPattern) {
    defaultOptions.interpolationPattern = interpolationPattern;
}

export function createResource(method, apiUrl, options = {}) {
    const expandedOptions = { ...defaultOptions, ...options };

    function buildUrl(urlParams = {}) {
        const { interpolationPattern } = expandedOptions;
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
            options: expandedOptions,
        };
    }

    function getTransformedPayload(payload) {
        const { inputMap } = expandedOptions;
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
            transformedPayload = undefined;
        }
        return transformedPayload;
    }

    function getHeaders(payload) {
        const { headersMap } = expandedOptions;
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
            headers = undefined;
        }
        return headers;
    }

    async function call(payload = undefined) {
        const fullUrl = buildUrl(payload);
        const transformedPayload = getTransformedPayload(payload);
        const headers = getHeaders(payload);

        const { withCredentials, parsers } = expandedOptions;
        const axiosOptions = {};
        if (headers) {
            axiosOptions.headers = headers;
        }
        if (withCredentials) {
            axiosOptions.withCredentials = withCredentials;
        }

        let body;
        let isFailure = false;
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
                default:
                    throw new Error(`Invalid method ${method}`);
            }
            body = response.data;
        } catch (err) {
            isFailure = true;
            if (err.response) {
                body = err.response.data;
            } else {
                throw err;
            }
        }

        return invokeParsers(parsers, body, isFailure, payload, expandedOptions);
    }

    return {
        buildUrl,
        call,
        getProperties,
    };
}

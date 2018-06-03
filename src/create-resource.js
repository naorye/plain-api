import axios from 'axios';

const INTERPOLATION_PATTERN = /\{\{(\w+)\}\}/gi;

function invokeParsers(parsers = [], body, isFailure, payload) {
    let parsersArr;
    if (!Array.isArray(parsers)) {
        parsersArr = [ parsers ];
    } else {
        parsersArr = parsers;
    }
    const originalBody = Object.freeze(body);
    const parsedBody = parsersArr.reduce((interBody, parser) =>
        parser(interBody, isFailure, payload), originalBody);
    return parsedBody;
}

export function createResource(method, apiUrl, url, options = {}) {
    function buildUrl(urlParams = {}) {
        return url.replace(INTERPOLATION_PATTERN, (match, p1) =>
            (
                Object.prototype.hasOwnProperty.call(urlParams, p1) ?
                    encodeURIComponent(urlParams[p1]) :
                    match
            ));
    }

    function getFullUrl(urlParams = {}) {
        return apiUrl + buildUrl(urlParams);
    }

    function getProperties() {
        return {
            apiUrl, method, url, options,
        };
    }

    function getTransformedPayload(payload) {
        const { inputMap } = options;
        let transformedPayload;
        if (inputMap && payload) {
            transformedPayload = Object.keys(inputMap).reduce((data, key) => ({
                ...data,
                [inputMap[key]]: payload[key],
            }), {});
        } else {
            transformedPayload = undefined;
        }
        return transformedPayload;
    }

    function getHeaders(payload) {
        const { headersMap } = options;
        let headers;
        if (headersMap && payload) {
            headers = Object.keys(headersMap).reduce((data, key) => ({
                ...data,
                [headersMap[key]]: payload[key],
            }), {});
        } else {
            headers = undefined;
        }
        return headers;
    }

    async function call(payload = undefined) {
        const fullUrl = getFullUrl(payload);
        const transformedPayload = getTransformedPayload(payload);
        const headers = getHeaders(payload);

        const { withCredentials, parsers } = options;
        const axiosOptions = { };
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

        return invokeParsers(parsers, body, isFailure, payload);
    }

    return {
        buildUrl, getFullUrl, call, getProperties,
    };
}

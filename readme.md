# Plain Api
> Thin wrapper around your favorite HTTP client to simplify your api calls 

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads Stats][npm-downloads]][npm-url]

Every new project I do, I find myself heavily thinking of how to integrate api calls to my app. Should I use my favorite HTTP client directly in my business logic? Where should I store the endpoint urls? How to inject url-params? How should I prepare the input payload? Where and how should I parse the response? and many other questions.

... I decided to put an end to those questions and write a thin wrapper around axios to simplify api usage and to clear my code. Plain Api is using [axios](https://github.com/axios/axios) but it is super simple to create a [superagent](https://github.com/visionmedia/superagent) / [request](https://github.com/request/request) / [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) version of it.


## Installation

```sh
npm install --save plain-api
```
Or
```sh
yarn add plain-api
```

## Usage example

Here is a react action written with [redux-thunk](https://github.com/reduxjs/redux-thunk) middleware. This action retrieves the price history of a cryptocurrency pairs. The pairs are provided to the action that uses Bittrex public api to fetch the market history.
```javascript
import axios from 'axios';

function getPriceHistory(pairs = 'BTC-DOGE') {
    return async function (dispatch, getState) {
        const state = getState();
        const isLoading = selectors.isLoading(state);

        if (isLoading) {
            return;
        }

        const response = await axios.get(
            'https://bittrex.com/api/v1.1/public/getmarkethistory',
            { params: { market: pairs } }
        );
        const { data } = response;
        if (!data.success) {
            return dispatch(setPriceHistoryError(data.message));
        } else {
            const priceHistory = data.result.map(item => ({
                price: item.Price,
                timestamp: item.TimeStamp,
            }));
            return dispatch(setPriceHistory(priceHistory));
        }
    };
}
```
This action is very simple, the request isn't much complicate and yet there is a few problems:
1. My action depends on to the HTTP client module (axios). If I'd like to replace it with the new shiny fetch api, I'll have to touch every action that performs api calls.
2. The action parses the response. If Bittrex will decide to change their api, I'll have to update my action. When dealing with complex actions, it is better to keep away the parsing from the action so I can keep the action as simple as possible.
3. In case I'd like to reuse that api in other places I'll have to duplicate some of that code.

Let's separate the api from the action:
```javascript
import { createResource } from 'plain-api';

export const fetchPriceHistory = createResource('get', 'https://bittrex.com/api/v1.1/public/getmarkethistory', {
    inputMap: {
        pairs: 'market'
    },
    parsers: {
        data => {
            if (!data.success) {
                throw new Error(data.message);
            }
            
            return data.result;
        },
        items => items.map(item => ({
            price: item.Price,
            timestamp: item.TimeStamp,
        }))
    }
})
```
And now use it:
```javascript
import { fetchPriceHistory } from './resources';

function getPriceHistory(pairs = 'BTC-DOGE') {
    return async function (dispatch, getState) {
        const state = getState();
        const isLoading = selectors.isLoading(state);

        if (isLoading) {
            return;
        }

        try {
            const priceHistory = await fetchPriceHistory.call({ pairs });
            dispatch(setPriceHistory(priceHistory));
        } catch(err) {
            dispatch(setPriceHistoryError(err.message))
        }
    };
}
```
That's much better. Now we can focus on our business logic and not api details :) 

## Documentation

The main method is `createResource(method, apiUrl, options)` and it expects the following:
* `method` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Can be one of `post`, `put`, `get` or `delete`
* `apiUrl` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Api url (for example: `https://bittrex.com/api/v1.1/public/getmarkethistory`). See below for more info
* `options` - **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Supports `withCredentials`,
`headersMap`, `inputMap` and `parsers`. See below for more info

### Url Interpolation
-complete

### withCredentials
-complete

### Headers
-complete

### Payload
-complete

### Parse the Response
-complete

## Tests

Tests are written with [jest](https://facebook.github.io/jest/). In order to run it, clone this repository and:

```sh
npm test
```

## Release History

* 1.0.0
    * First stable tested version

## Meta

Naor Ye – naorye@gmail.com

Distributed under the MIT license. See ``LICENSE`` for more information.

[https://github.com/naorye/plain-api](https://github.com/naorye/plain-api/)

## Contributing

1. Fork it (<https://github.com/naorye/plain-api/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

<!-- Markdown link & img dfn's -->
[npm-image]: https://img.shields.io/npm/v/datadog-metrics.svg?style=flat-square
[npm-url]: https://npmjs.org/package/datadog-metrics
[npm-downloads]: https://img.shields.io/npm/dm/datadog-metrics.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/dbader/node-datadog-metrics/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/dbader/node-datadog-metrics
[wiki]: https://github.com/yourname/yourproject/wiki
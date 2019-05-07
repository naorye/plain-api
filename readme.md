# Plain Api
> Thin wrapper around your favorite HTTP client to simplify your api calls 

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]
<!-- [![Downloads Stats][npm-downloads]][npm-url] -->

Every new project I do, I find myself heavily thinking of how to integrate api calls to my app. Should I use my favorite HTTP client directly in my business logic? Where should I store the endpoint urls? How to inject url-params? How should I prepare the input payload? Where and how should I parse the response? and many other questions.

... I decided to put an end to those questions and write a thin wrapper around axios to simplify api usage and to clear my code. Plain Api is using [axios](https://github.com/axios/axios) and it is super simple to create a [superagent](https://github.com/visionmedia/superagent) / [request](https://github.com/request/request) / [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) clone of it.


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
    parsers: [
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
    ]
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
* `options` - **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Supports `withCredentials`, `interpolationPattern`, `headersMap`, `inputMap`, `transformPayload` and `parsers`. See below for more info


### Url Interpolation

Sometimes we need to inject parameters to the api url. For example `GET https://api.example.com/chat/5/members` will be used to get the members list of room with id equal to `5`. Let's define such resource and use it:
```javascript
import { createResource } from 'plain-api';

const fetchChatMembers = createResource('get', 'https://api.example.com/chat/{{chatId}}/members');
...
...
...
const chatId = 5;
const members = await fetchChatMembers.call({ chatId });
```
`{{chatId}}` in the url is used as a placeholer. When calling the resource with `chatId = 5`, the parameter injected into the url.   
If we call the resource without providing the required interpolation params, the placeholders won't be replaced.

### Changing Interpolation Pattern

As a default, the regular expression that is used for injecting url parameters is `/\{\{(\w+)\}\}/gi` (which matches to all the wordes wraped inside `{{}}`). You can override this default by calling `setDefaultInterpolationPattern(pattern)`:   
```javascript
import { createResource, setDefaultInterpolationPattern } from 'plain-api';

setDefaultInterpolationPattern(/\:(\w+)/gi);
...
...
const fetchChatMembers = createResource('get', 'https://api.example.com/chat/:chatId/members');
...
...
const chatId = 5;
const members = await fetchChatMembers.call({ chatId });
```
Now `:chatId` will be replaced with `5`.

Other option to override the interpolation pattern for a specific resource is to provide it as an option when creating the resource:
```javascript
import { createResource } from 'plain-api';

const fetchChatMembers = createResource('get', 'https://api.example.com/chat/:chatId/members', {
    interpolationPattern: /\:(\w+)/gi
});
...
...
const chatId = 5;
const members = await fetchChatMembers.call({ chatId });
```
This will override the default interpolation pattern only for that specified resource.

### withCredentials

A boolean indicates whether or not cross-site requests should be made using credentials such as cookies, authorization headers or TLS client certificates. Default is `false`. You can read more [here](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials).


### Headers

`headersMap` let us to decide which parameter will be passed to the header. For example, sending a request with `X-Auth-Token` header:
```javascript
import { createResource } from 'plain-api';

const postMessage = createResource('post', 'https://api.example.com/message', {
    headersMap: {
        token: 'X-Auth-Token'
    }
});
...
...
...
const token = 'this-is-some-user-token';
await postMessage.call({ token });
```
In this example we performed a request and set the header `X-Auth-Token` with the provided token.   
If we call the resource without providing `token`, the header won't be added.


### Body

`inputMap` is used to define the request payload. For example, if our api expects an object in the form `{ user_name, user_age, home_address }`, we will define the following resource:
```javascript
import { createResource } from 'plain-api';

const updateUser = createResource('put', 'https://api.example.com/user', {
    inputMap: {
        name: 'user_name',
        age: 'user_age',
        address: 'home_address'
    }
});
...
...
...
await updateUser.call({
    name: 'Dan',
    age: 23,
    address: 'Somewhere under the sea'
});
```
Parameters that will not be defined in `inputMap` won't be added to the request body.   
Input of `GET` requests is passed using query string.

## Manipulate request payload

`transformPayload` option can be used to manipulated payload right before calling the api. 
```javascript
import { createResource } from 'plain-api';

const updateUser = createResource('put', 'https://api.example.com/user', {
    inputMap: {
        name: 'user_name',
    },
    transformPayload: payload => ({
        ...payload,
        user_name: payload.user_name.toUpperCase(),
    })
});
...
...
...
await updateUser.call();
```
In this example, the resource transforms the case of the user_name parameter in the paylod. Any `updateUser` request will be sent with upper case user name.


### Parse the Response

We can define `parsers` array in order to parse the response body. Each parser is a method that gets the parsed response body, a boolean indicator whether the request status code represents a failure and the original payload sent to the request.   
For example:
```javascript
import { createResource } from 'plain-api';

const getUser = createResource('get', 'https://api.example.com/users/{{userId}}', {
    parsers: [
        (data, isFailure, payload) => {
            if (isFailure) {
                throw new Error(`Fail to call api with userId equals to ${payload.userId}`);
            }
            return data.profile;
        },
        profile => {
            name: profile.user_name,
            age: profile.user_age,
            address: profile.home_address
        }
    ]
});
...
...
...
try {
    const user = await getUser.call({ userId: 12 });
    console.log(`Name: ${user.name}, Age: ${user.age}, Address: ${user.address}`);
} catch (err) {
    console.log(`Request failed: ${err.message}`);
}
```
In this example we provide dtwo parsers. If the request failed (status code different from 2xx), the first parser will throw an error. Otherwise it will return the user profile which will be parsed by the second parser.

### Errors handling

* If an api call respond with 2xx status code, everything is fine and no error will be thrown.   
* If an api call respond with failure status code and contains a response (there was a host that got the request and sent a response), no error will be thrown but the parsers will get `true` value in `isFailure`. In this case a parser can decide to throw an error which will be propagate to the api caller.
* If an api call respond with failure status code and doesn't contain a response (there was nobody on the other side, no handler / no server / no internet connection / ... no response), an error will be thrown and no parser will be called.

## Tests

Tests are written with [jest](https://facebook.github.io/jest/). In order to run it, clone this repository and:

```sh
npm test
```

## Release History

* 1.0.6
    * Add support for transformPayload option
* 1.0.5
    * Add prettier and eslint
    * Support default options
* 1.0.4
    * Update dependencies and fix potential security vulnerabilities
* 1.0.3
    * Add support for setting and changing interpolation pattern
    * Bug fixes
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
[npm-image]: https://img.shields.io/npm/v/plain-api.svg?style=flat-square
[npm-url]: https://npmjs.org/package/plain-api
[npm-downloads]: https://img.shields.io/npm/dm/plain-api.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/naorye/plain-api/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/naorye/plain-api
[coveralls-image]: https://img.shields.io/coveralls/naorye/plain-api.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/naorye/plain-api?branch=master
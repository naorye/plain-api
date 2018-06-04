const { createResource } = require('plain-api');

const fetchPriceHistory = createResource('get', 'https://bittrex.com/api/v1.1/public/getmarkethistory', {
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

async function run() { 
    const priceHistory = await fetchPriceHistory.call({ pairs: 'BTC-DOGE' });
    console.log(priceHistory);
}

run();
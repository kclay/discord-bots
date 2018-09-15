/**
 *
 * @param {HttpClientConfig} config
 * @return {Request}
 */

const {stringify} = require("querystring");
const request = require('request-promise');

const httpAdapter = async (config) => {
    let url = config.url;
    if (config.params) {
        url = `${url}?${stringify(config.params)}`;
    }

    return request({
        url: url,
        body: JSON.stringify(config.body),
        headers: {
            'X-API-Key': process.env.BUNGIE_API_KEY,
            'Content-Type': 'application/json'
        },
        json: true,
        credentials: 'include'
    });

};
module.exports = httpAdapter;
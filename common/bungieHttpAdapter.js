/**
 *
 * @param {HttpClientConfig} config
 * @return {Request}
 */

import {stringify} from "querystring";

const httpAdapter = async (config) => {
    let url = config.url;
    if (config.params) {
        url = `${url}?${stringify(config.params)}`;
    }
    return request({
        url: url,
        body: JSON.stringify(config.body),
        headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
        },
        json: true,
        credentials: 'include'
    });

};
module.exports = httpAdapter;
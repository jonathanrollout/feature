'use strict';
const uuid = require('uuid/v4');
const fs = require('fs');
const nock = require('nock');

exports.generateKey = function() {
    return 'key: ' + uuid();
}

exports.generateValue = function() {
    return 'value: ' + uuid();
}

exports.writeKeyValueToFile = function(key, value) {
    let configuration = {conf:{}};
    configuration.conf[key] = value;
    fs.writeFileSync(__dirname+'/../map.json', JSON.stringify(configuration));
}

exports.createMap = function(key, value) {
    let configuration = {conf:{}};
    configuration.conf[key] = value;
    return configuration;
}

exports.setFakeConfHttpResponse = function(configuration) {
    nock('http://bla.com')
        .get('/customerKey/conf')
        .reply(200, configuration);
}

exports.setFakeConfHttpErrorResponse = function () {
    nock('http://bla.com')
        .get('/customerKey/conf')
        .reply(404);
}
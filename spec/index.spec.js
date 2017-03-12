'use strict';
const fs = require('fs');
const toggle = require('../index');
const testUtils = require('./testUtils');


const MAP_LOCATION = __dirname+'/../map.json';

describe('feature toggle E2E tests', ()=>{
    beforeEach(()=>{
        testUtils.setFakeConfHttpErrorResponse();
    })

    describe('get', ()=>{
        it('should throw an key not found error when key does not exist', (done)=>{
            let key = testUtils.generateKey();
            testUtils.writeKeyValueToFile(key);

            let featureToggle = new toggle.featureToggle('customerKey');

            featureToggle.get(key).catch((error)=>{
                expect(error).toEqual(new Error('key: '+key+' not found'));
                done();
            })
        })

        it('should read key from local storage', (done)=>{
            let key = testUtils.generateKey();
            let expectedValue = testUtils.generateValue();
            testUtils.writeKeyValueToFile(key, expectedValue);

            let featureToggle = new toggle.featureToggle('customerKey');

            featureToggle.get(key).then((value)=>{
                expect(value).toEqual(expectedValue);
                done();
            }).catch((error)=>{
                done.fail(error);
            })
        })

        it('should throw an error when customerKey is not set', ()=>{
            expect(()=>new toggle.featureToggle()).toThrowError('You must supply customerKey inorder to user featureToggle');
        })
    })
})
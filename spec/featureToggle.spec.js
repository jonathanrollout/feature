const FeatureToggleClass = require('../featureToggle').featureToggle;
const fs = require('fs');
const testUtils = require('./testUtils');
const nock = require('nock');

const MAP_LOCATION = __dirname+'/../map.json';

function setFakeReadConfiguration(configuration) {
    spyOn(fs, 'readFile').and.callFake((location, callback)=>callback(undefined, configuration));
}

function setFakeReadConfigurationWithError() {
    spyOn(fs, 'readFile').and.callFake((location, callback)=>callback('error', undefined));
}

function setFakeDeleteFile() {
    spyOn(fs, 'unlink').and.callFake((location, callback)=>callback());
}

describe('featureToggle class', ()=>{

    describe('first runtime (no conf present in filesystem)', ()=>{
        beforeEach(()=>{
            setFakeReadConfigurationWithError();
            setFakeDeleteFile();
        })

        it('should get the conf form the server', (done)=>{
            let newKey = testUtils.generateKey();
            let newValue = testUtils.generateValue();

            let newConf = testUtils.createMap(newKey, newValue);
            testUtils.setFakeConfHttpResponse(newConf);

            let featureToggle = new FeatureToggleClass('customerKey');

            featureToggle.get(newKey).then((value)=>{
                expect(value).toEqual(newValue);
                done();
            }).catch((error)=>{
                done.fail(error);
            })
        })

        it('should return an error when retrieving from server returned an error', (done)=>{
            let newConf = testUtils.createMap(testUtils.generateKey(), testUtils.generateValue());
            testUtils.setFakeConfHttpErrorResponse();

            let featureToggle = new FeatureToggleClass('customerKey');

            expect(featureToggle.get('key').catch((error)=>{
                done();
            }))
        })

        it('should return an error when retrieving from server failed', (done)=>{
            nock('http://bla.com')
                .get('/customerKey/conf')
                .replyWithError('something awful happened');
            let featureToggle = new FeatureToggleClass('customerKey');

            featureToggle.get('key').catch((error)=>{
                done();
            })
        })
    })


    describe('conf found in client file system', ()=>{
        beforeEach(()=>{
            let configuration = JSON.stringify({conf:{key: "value"}});
            let newConfiguration = testUtils.createMap(testUtils.generateKey(), testUtils.generateValue());

            setFakeReadConfiguration(configuration);
            testUtils.setFakeConfHttpResponse(newConfiguration);
            setFakeDeleteFile();
        })

        it('should throw a key not found error when key does not exist', (done)=>{
            let featureToggle = new FeatureToggleClass('customerKey');
            let nonExistingKey = testUtils.generateKey();
            featureToggle.get(nonExistingKey).catch((error)=>{
                expect(error).toEqual(new Error('key: '+nonExistingKey+' not found'));
                done();
            })
        })

        it('should read key from local storage', (done)=>{
            let featureToggle = new FeatureToggleClass('customerKey');
            featureToggle.get('key').then((value)=>{
                expect(value).toEqual('value');
                done();
            })
        })
    })

    it('should return the same value for a given key even if the value was updated from the server', (done)=>{
        let configuration = JSON.stringify({conf:{key: "value"}});

        let newValue = testUtils.generateValue();
        let newConf = testUtils.createMap('key', newValue);

        testUtils.setFakeConfHttpResponse(newConf);
        setFakeReadConfiguration(configuration);
        setFakeDeleteFile();

        let featureToggle = new FeatureToggleClass('customerKey');

        //TODO: change to be deterministic
        featureToggle.get('key').then((oldValue)=>{
            setTimeout(()=>{
                featureToggle.get('key').then((value)=>{
                    expect(value).toEqual(oldValue);
                    done();
                });
            }, 10)
        });



    });

    it('should get the latest conf from the server when loaded', (done)=>{

        let configuration = JSON.stringify({conf:{key: "value"}});
        let newKey = testUtils.generateKey();

        let newValue = testUtils.generateValue();
        let newConf = testUtils.createMap(newKey, newValue);

        setFakeReadConfiguration(configuration);
        testUtils.setFakeConfHttpResponse(newConf);
        setFakeDeleteFile();

        let featureToggle = new FeatureToggleClass('customerKey');

        //TODO: change to be deterministic
        setTimeout(()=>{
            featureToggle.get(newKey).then((value)=>{
                expect(value).toEqual(newValue);
                done();
            });
        }, 20)
    });

    it('should delete the persistent cache after uploading it to memory', (done)=>{
        let configuration = JSON.stringify({conf:{key: "value"}});

        setFakeDeleteFile();
        setFakeReadConfiguration(configuration);

        let featureToggle = new FeatureToggleClass('customerKey');

        featureToggle.get('key').then((value)=>{
            expect(fs.unlink).toHaveBeenCalled();
            done();
        })
    });

    it('should write the cache from the server to a file when server return configuration', (done)=>{

        let newConf = testUtils.createMap(testUtils.generateKey(), testUtils.generateValue());
        testUtils.setFakeConfHttpResponse(newConf);
        setFakeDeleteFile();

        let featureToggle = new FeatureToggleClass('customerKey');

        spyOn(fs, 'writeFile').and.callFake((location, text, callback)=> {
            callback();
            expect(text).toEqual(JSON.stringify(newConf));
            done();
        });
    });

    it('should not throw error when the sever has the config file but cannot load new one from server', (done) => {
        let configuration = JSON.stringify({conf:{key: "value"}});
        setFakeReadConfiguration(configuration);
        setFakeDeleteFile();
        testUtils.setFakeConfHttpErrorResponse();

        let featureToggle = new FeatureToggleClass('customerKey');

		//TODO: change to be deterministic
        setTimeout(()=>{
            featureToggle.get('key')
                .then((value)=>{
					done();
				})
                .catch((error)=>{
                    done.fail(error);
                })


        }, 1000)

    })
})
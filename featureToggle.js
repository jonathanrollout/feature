'use strict';
const fs = require('fs');
const request = require('request-promise-native');
const errors = require('request-promise-native/errors');

const CONFIGURATION_LOCATION = __dirname+'/map.json';

function getFeatureToggleMapFromConfiguration(configurationJson) {
    return JSON.parse(configurationJson).conf;
}

class FeatureToggle {
    constructor(customerKey) {
        if(typeof customerKey === 'undefined') {
            throw new Error('You must supply customerKey inorder to user featureToggle');
        }
        this.customerKey = customerKey;
        this.loadedCache = this.loadCache();
        this.runTimeCache = {};
    }


    get(key) {
        return this.loadedCache.then(()=>
            new Promise((resolve, reject)=>{
                if (typeof this.runTimeCache[key] !== 'undefined') {
                    resolve(this.runTimeCache[key]);
                }
                else if(typeof this.cache[key] !== 'undefined') {
                    this.runTimeCache[key] = this.cache[key];
                    resolve(this.runTimeCache[key]);
                }
				else {
                    reject(new Error('key: ' + key + ' not found'));
                }
            })
        )
    }

    loadCache() {
        return new Promise((resolve, reject)=>
            this.getCacheFromFile()
                .then((cache) => {
                    this.updateCache(cache);

                    this.deleteConfigurationFile()
                        .then(() => this.getConfigurationFromServer()
                            .then((configuration) => this.updateCache(configuration))
							.catch(()=>{}))
						.catch(()=>{});
					resolve(true);
					
                })
                .catch((error)=> {
                    this.getConfigurationFromServer()
                        .then((cacheFromServer) =>{
                            this.updateCache(cacheFromServer);
                            resolve(true);
                        })
                        .catch((error)=>reject(error));
                })
        );
    }

    getCacheFromFile() {
        return new Promise((reslove, reject)=>{
            fs.readFile(CONFIGURATION_LOCATION, (error, configuration) =>{
                if(error) {
                    reject(error);
                }
				else {
                    reslove(getFeatureToggleMapFromConfiguration(configuration));
                }
            });
        });
    }

    updateCache(cache) {
        this.cache = cache;
    }

    deleteConfigurationFile() {
        return new Promise((resolve, reject)=>{
            fs.unlink(CONFIGURATION_LOCATION, (error)=>{
                if(error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }

    getConfigurationFromServer() {
        return request.get(`http://bla.com/${this.customerKey}/conf`)
            .then((configuration)=>{
                this.writeConfigurationToFile(configuration);
                return getFeatureToggleMapFromConfiguration(configuration);
            });
    }
	
    writeConfigurationToFile(cache) {
        return new Promise((resolve, reject)=>{
            fs.writeFile(CONFIGURATION_LOCATION, cache, (error)=>{
                if(error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
}


exports.featureToggle = FeatureToggle;
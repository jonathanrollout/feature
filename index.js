'use strict';
const FeatureToggleClass = require('./featureToggle').featureToggle;

class ToggleMap {

    constructor(userId) {
        this.toggle = new FeatureToggleClass(userId);
    }

    get(key) {
        return this.toggle.get(key);
    }
}

exports.featureToggle = ToggleMap;

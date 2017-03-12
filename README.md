#FeatureToggle
 
FeatureToggle is a dead simple library to get feature toggles from our servers.
It uses ES6 Promises in order not blocking your code while contacting our servers.
 
 
Usage
all you need to do is to supply the "account id" and register to the promise of 'get'
```
const featureToggle = require('featureToggle');
 
let ft = new featureToggle.featureToggle("account id");
ft.get('key').then((value) => console.log(value));
```
Error Handling
```
...
ft.get('key').catch((error) => console.error(error));
...
```
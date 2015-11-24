const XEP = require('./index');
global.XMLHttpRequest = require('xhr2');

const targetURL = 'http://www.example.com/';

XEP.getDocument({url: targetURL}).then( (arg)=>{
    console.log('getDocument-then', arg);
}).catch( (error)=>{
    console.log('getDocument-catch', error);
});

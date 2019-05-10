/*
 *helpers for various tasks
 */
//Dependencies
const crypto = require('crypto');
const config = require('../lib/_configgg');
const _data = require('../lib/data');

//Container for all the helpers
const helpers = {};

//Create a SHA256 hash
helpers.hash = function(str) {
if(typeof(str) == 'string' && str.length > 0) {
    const hash = crypto.createHmac('SHA256',config.hashingSecret).update(str).digest('hex');
    return hash;
}
else {
    return false;
}
};
//parse json string to object in all cases, without throwing 
helpers.parseJsonToObject = function(str) {
    try {
     const obj = JSON.parse(str);
     // if the catch doesn't called then it return Obj
     return obj;
    }
    catch(e) {
        return {};
    }
};

// 
helpers.createRandomString = function(strlength) {
 const strlength = typeof(strlength) == 'number' && strlength.length > 0 ? strlength : false ;
 if(strlength) {
   const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
   const str = '';
   for(i=0;i<strlength;i++) {
       // Get a randome character until it reaches its length
       const randomeCharacter = possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length));
       str =+ randomeCharacter;
   }
   // return the final string 
   return str;
 }
 else {
  return false ;
 }
};
module.exports = helpers;
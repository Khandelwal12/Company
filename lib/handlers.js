const _data = require('../lib/data');
const helpers = require('../lib/helpers');
const config = require('/lib/_configgg');

// Container for all the handlers
const handlers = {} 

    //Ping handler
     handlers.ping = function(data,callback) {
         callback(200);
     };
     handlers.users = function(data,callback) {
     const acceptableMethods = ['post','get','put','delete']; 
     if(acceptableMethods.indexOf(data.methods) > -1) {
     handlers._users[data.methods](data,callback);
     }
     else {
        callback(405);
     }
    };

    // Container for the users submethods
    handlers._users = {};
    // Users - Post
    // Required data : FirstName, LastName, Phone, Password, TosAgreement
    handlers._users.post = function(data,callback) {
    //check all the fields are filled out 
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false ;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false ;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false ;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false ;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? data.payload.tosAgreement : false ;

    if(firstName && lastName && phone && password && tosAgreement) {
    // Make sure that user does not exist already 
    _data.read('users',phone,function(err,data) {
    if(err) { 
     // hash password
     const hashPassword = helpers.hash(password);   
     // Create A user 
     if(hashPassword) {
     const userObject = {
        'firstName' : firstName,
        'lastName' : lastName,
        'phone' : phone,
        'hashPassword' : hashPassword,
        'tosAgreement' : true
     };
     // Persists the user
       _data.create('users',phone,userObject,function(err) {
        if(!err) {
        callback(200);
        }
        else {
        callback(500,{'Error':'Could not create the new user'});
        }
       });
     } 
     else {
        callback(500,{'Error': 'Could not hash the users password'});
        }
    }  
    else {
        callback(400, {'Error': 'A user with that phone number already exists'});
        }
     });
}
    else {
        callback(400,{'Error' : 'Missing required fields' });
    }
};
//users -- get
// required data -- phone 
//Optional data -- None
// @TODO only let an authenticated user access their object , don't let them access anyone object 
  handlers._users.get = function(data,callback) {
      // check that phone number is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false ;
  if(phone) {
      //Get the token from the headers
      const token = typeof(data.headers.token) == 'string' ? data.headers.token : false ;
      // verify given token is valid for the phone number
      handlers._tokens.verifyToken(token,phone,function(tokenIsValid) {
          if(tokenIsValid) {
             // Lookup the user
            _data.read('users',phone,function(err,data) {
             if(!err && data) {
             // Remve the hashpassword from userObject before returning it to the user .
            delete data.hashPassword;
            callback(200,data);
               }
         else {
          callback(404);
              }
        });
          }
          else {
            callback(403,{'Error': 'Missing required token in header or Token is invalid '});              
          }
       });
    }
  else {
      callback(400,{'Error':'Missing required fields'});  
     }
};
    
//users -- Put
// required data -- phone 
//Optional data -- firstname, lastname , password (Atleast one must be specified)
//@TODO only let an authenticated user update their object , don't let them update anyone else object  
handlers._users.put = function(data,callback) {
// check for the required field 
const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false ;

// check for the optional field 
const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false ;
const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false ;
const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false ;

  if(phone) {
   // Error if nothing sent to update 
   if(firstName || lastName || password) {
       //Get the token from the headers
      const token = typeof(data.headers.token) == 'string' ? data.headers.token : false ;
      handlers._tokens.verifyToken(token,phone,function(tokenIsValid) {
        if(tokenIsValid) {
            _data.read('users',phone,function(err,data) {
                if(!err && data) {
                 // update the fields necessary as per user 
                 if(firstName) {
                   // updating user object with firstName
                    data.firstName = firstName ;
                 }
                 if(lastName) {
                    data.lastName = lastName ;
                 }
                 if(password) {
                  // we need to hash the password here and then update it 
                  data.hashPassword = helpers.hash(password);
                 }
                 // Now after updation we need to store this new updates 
                 _data.update('users',phone,data,function(err) {
                    if(!err) {
                        callback(200);
                    }
                    else {
                        console.log(err);
                        callback(500,{'Error': 'Could not update the user/Internal Server Error'}); // 500 - Nothing wrong with user request
                    }
                 });
                }
                else {
                    callback(400,{'Error' : 'The specified user does not exist'});
                }
               });
               }
               else {
                   callback(404,{'Error': 'Missing required tokens in header or token is invalid'});
               }
            });
        }
        else {
          callback(400,{'Error':'Missing fields to update'});
        }
    }
      else {
          callback(400,{'Error': 'Missing required fields'});
      }
    }; 

//users - delete
// required field - phone
// @TODO Only let an authenticated user delete their object, don't let them delete anyone else object
// @TODO  cleanup (delete) any other data files associated with this user  
handlers._users.delete = function(data,callback) {
 // check the phone number is valid 
 const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false ;
  if(phone) {
        //Get the token from the headers
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false ;
        handlers._tokens.verifyToken(token,phone,function(tokenIsValid) {
          if(tokenIsValid) { 
               // Lookup the user 
         _data.read('users',phone,function(err,userData) {
            if(!err && userData) {
             _data.delete('users',phone,function(err) {
                if(!err) {
                    // cleanup other data
                // Now we need to delete each of the checks associated with the user
                const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                const checksToDelete = userChecks.length;
                if(checksToDelete>0) {
                    const checksDeleted = 0;
                    const deletionErrors = false;
                    //loop through checks
                    userChecks.array.forEach(checkId => {
                        //delete the check
                        _data.delete('checks',checkId,function(err) {
                            if(err) {
                                deletionErrors = true;
                            }
                            checksDeleted++;
                            if(checksDeleted == checksToDelete) {
                                if(!deletionErrors) {
                                    callback(200);
                                }
                                else {
                                    callback(500,{'Error':'Errors encountered while attempting to delete all of the users checks,All checks may not have been deleted from the system successfully'});
                                }
                            }
                        });
                    });
                }
                else {
                    callback(200);
                }
            }
               else {
                callback(500,{'Error' : 'Could not delete the specified user/Internal Server Error'});
               }
            });
        }
        else {
        callback(400,{'Error' : 'Could not find the specified user'});
        }
    });
 }
         else {
           callback(404,{'Error': 'Missing required tokens in header or token is invalid'});
          } 
        });
   }
    else {
      callback(400,{'Error':'Missing Required field'});
   }
};

//
handlers.tokens = function(data,callback) {
    const acceptableMethods = ['post','get','put','delete']; 
    if(acceptableMethods.indexOf(data.methods) > -1) {
    handlers._tokens[data.methods](data,callback);
    }
    else {
       callback(405);
    }
   };

   //container for all the tokens methods
   handlers._tokens = {};

   //Token -Post 
   handlers._tokens.post = function(data,callback) {
   const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false ;
   const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false ;
   
   if(phone && password) {
    // Lookup the user who matches that phone 
    _data.read('users',phone,function(err,data) {
    if(!err && data) {
    // hash the sent password and compare it to the password stored in userObject password
     const hashPassword = helpers.hash(password);
     if(hashPassword == data.hashPassword) {
         // if valid, Create a new token with random name for subsequent request and expiration 1 hr
         const tokenId = helpers.createRandomString(20); 
         const expires = Date.now + 1000*60*60 ;

         const tokenObject = {
            'phone' : phone,
            'id' : tokenId,
            'expires' : expires
         };
         // Store the token 
          _data.create('tokens',tokenId,tokenObject,function(err) {
            if(!err) {
                callback(200,tokenObject);
            }
            else {
                callback(500,{'Error' : 'Could not create the new token'});
            }
         });
     }
     else {
         callback(400,{'Error' : 'Password did not match the specified user '});
     }
    }
    else {
        callback(400,{'Error' : 'Could not find the specified user'});
    }
    });
   }
   else {
     callback(400,{'Error' : 'Missing Required fields'});
   }
};
// Tokens - Get
// Required data : id 
// Optional data : None
handlers._tokens.get = function(err,callback) {
    // check that id is valid 
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false ;
  if(id) {
      // Lookup the tokens
   _data.read('tokens',id,function(err,tokenData) {
    if(!err && tokenData) {
        
        callback(200,tokenData);
    }
    else {
        callback(404);
    }
   });
  }
  else {
      callback(400,{'Error':'Missing Required field'});
  }
};
//Tokens -- Put
// Required data -- id
// Optional data -- None
handlers._tokens.put = function(err,callback) {
const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false ;
const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false ;
   if(id && extend) {
    // lookup the token 
    _data.read('tokens',id,function(err,tokenData) {
     if(!err && tokenData) {
     // just make sure that token is not already expired 
       if(tokenData.expires>Date.now()) {
       // set the expiration an hour from now 
        tokenData.expires = Date.now() * 1000*60*60;
        // Store the new updates
        _data.update("tokens",id,tokenData,function(err) {
            if(!err) {
                callback(200);
            }
            else {
                callback(500,{'Error':'Could not update the token expiration'});
            }
        });
       }
       else {
        callback(400,{'Error':'Token has already been expired '});
       }
     }
     else {
        callback(400,{'Error':'Specified token does not exist'});
    }
  });
}  
 else {
    callback(400,{'Error':'Missing Required Fields/Fields are invalid'});
     }
   
};

//Tokens -- Delete
//Required data -- id
//Optional data -- None 
handlers._tokens.delete = function(err,callback) {
    // Vaildation of id
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false ;
    if(id) {
        // Lookup the tokens
     _data.read('tokens',id,function(err,tokenData) {
      if(!err && tokenData) {
          _data.delete('tokens',id,function(err) {
            if(!err) {
                callback(200);
            }
            else {
                callback(500,{'Error': 'Could not delete the specified token'});
            }
          });
          
      }
      else {
          callback(400,{'Error': 'Specified tokenID does not exist'});
      }
     });
    }
    else {
        callback(400,{'Error':'Missing Required field'});
    }

};

// verify if a given token id is currently valid for a given user 
handlers._tokens.verifyToken = function(id,phone,callback) {
      _data.read('tokens',id,function(err,tokenData) {
        if(!err && tokenData) {
            // check the token is for the given user and has not expired
            if(tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            }
            else {
                callback(false);
            }

        }
        else {
            callback(false);
        }
       });
};

// Checks handler
handlers.checks = function(data,callback) {
const acceptableMethods = ['post','get','put','delete']; 
if(acceptableMethods.indexOf(data.methods) > -1) {
handlers._checks[data.methods](data,callback);
}
else {
   callback(405);
}
};

//container for all the checks methods
handlers._checks = {} ;

// Checks -- Post
//Required data -- protocol, url, methods,successcode
handlers._checks.post = function(data,callback) {
// validate inputs 
const protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol:false;
const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
const method = typeof(data.payload.methods) == 'string' && ['post','get','put','delete'].indexOf(data.payload.methods) > -1 ?data.payload.methods : false ;
const successCode = typeof(data.payload.successCode) == 'object' && data.payload.successCode instanceof Array && data.payload.successCode.length > 0 ? data.payload.successCode : false ;
const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <=5? data.payload.timeoutSeconds : false

if(protocol && url && methods && successCode && timeoutSeconds) {
    // get the token from the headers, lookup the user by reading that token  
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false ;

    // lookup the user by reading the token
    _data.read('tokens',token,function(err,tokenData) {   
        if(!err && tokenData) {    
            const userPhone = tokenData.phone;  
            // Now we can lookup users data 
            _data.read('users',userPhone,function(err,userData) {
                if(!err && userData) {
                    // does the check key exist in our userdata object 
                    const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                    // verify the user has less than the number of max checks per user
                    if(userChecks.length < config.maxChecks) {
                        // create a random id for the check 
                        const checkId = helpers.createRandomString(20);

                        //create the check object and include user's phone
                        const checkObject = {
                            'checkId' : checkId,
                            'userPhone': userPhone,
                            'protocol': protocol,
                            'url' : url,
                            'method' : method,
                            'successCode' : successCode,
                            'timeoutSeconds' : timeoutSeconds
                        }; 

                        // save the object 
                        _data.create('checks',checkId,checkObject,function(err) {
                            if(!err) {
                                //Add the check id to the user object 
                                userData.checks = userChecks;
                                userData.checks.push(checkId);

                                _data.update('users',userPhone,userData,function(err){
                                    if(!err) {
                                        // return the data about the new check 
                                        callback(200,checkObject);
                                    }
                                    else {
                                        callback(500,{'Error':'Could not update the user with check id '});
                                    }
                                });
                            }
                            else {
                                callback(500,{'Error': 'Could not create the new check'});
                            }
                        });
                    }
                    else {
                        callback(400,{'Error' : 'The user has already the maximum number of checks('+config.maxChecks+')'});
                    }
                }
                else {
                    callback(403); // token provided but it didn't correspond to real user 
                }
            });
        }
        else {
            callback(403);  // Unauthorised, token is not provided 
        }
    });
}
else {
    callback(400,{'Error':'Missing required inputs'});
}
};
// Check - Get 
// Required Data -- id
// Optional Data -- None
handlers._checks.get = function(data,callback) {
 const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim() == 20 ? data.queryStringObject.id.trim() : false ;
 if(id) {
 // Now we need to check which user has created this check , so lookup the checks
 _data.read('checks',id,function(err,checkData) {
    if(!err && checkData) {
    // Get the token   
    const token = typeOf(data.headers.token) == 'string' ? data.headers.token : false ; 
    //verify that given token is valid and belongs to user who has created the check.
    handlers._tokens.verifyToken(token,checkData.userPhone,function(isTokenValid) {
        if(isTokenValid) {
            callback(200,checkData);
        }
        else {
            callback(403);
        }
    });  
   }
    else {
        callback(404);
    }
   });
} 
 else {
     callback(400,{'Error' : 'Missing Required fields'});
  }
};

//checks -- Put
// Required Data -- id
// Optional Data -- protocol, url, methods, successCodes, timeoutSeconds (One of the optional must be sent)
handlers._checks.put = function(data,callback) {
// check for the required field
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim() == 20 ? data.queryStringObject.id.trim() : false;
// check for the optional field
    const protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol:false;
    const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.methods) == 'string' && ['post','get','put','delete'].indexOf(data.payload.methods) > -1 ?data.payload.methods : false ;
    const successCode = typeof(data.payload.successCode) == 'object' && data.payload.successCode instanceof Array && data.payload.successCode.length > 0 ? data.payload.successCode : false ;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <=5? data.payload.timeoutSeconds : false
  
    // check to make sure id is valid
    if(id) {
        // check to make sure one of optional field is valid
      if(protocol || url || method || successCode || timeoutSeconds) {
        // lookup the check
        _data.read('checks',id,function(err,checkData) {
            if(!err && checkData) {
                // Get the token from headers
                const token = typeof(data.headers.token) == 'string' ? data.headers.token : false ;
                // Verify the given token is valid and belongs to the user who has created checks
                handlers._tokens.verifyToken(token,checkData.userPhone,function(isTokenValid) {
                    if(isTokenValid) {
                        // update the check where necessary
                        if(protocol) {
                            checkData.protocol = protocol;
                        }
                        if(url) {
                            checkData.url = url;
                        }
                        if(method) {
                            checkData.method = method;
                        }
                        if(successCode) {
                            checkData.successCode = successCode;
                        }
                        if(timeoutSeconds) {
                            checkData.timeoutSeconds = timeoutSeconds;
                        }

                        // store the update 
                        _data.update('checks',id,checkData,function(err) {
                            if(!err) {
                                callback(200);
                            }
                            else {
                                callback(500,{'Error':'Could not update the check'});
                            }
                        });
                    }
                    else {
                        callback(403);
                    }
                });
            }
            else {
                callback(400,{'Error' : 'Check id does not exist'});
            }
        });
      }
      else {
            callback(400,{'Error':'Missing fields to update'});
        }
     }
    else {
        callback(400,{'Error': 'Missing Required fields'});
    }

};

// Checks --Delete 
// Required data -- checkId
// Optional Data -- None 
handlers._checks.delete = function(data,callback) {
    // check the id is valid 
 const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false ;
       if(id) {
       // lookup the checks
        _data.read('checks',id,function(err,checkData) {
            if(!err && checkData) {
                //Get the token from the headers
            const token = typeof(data.headers.token) == 'string' ? data.headers.token : false ;
            handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid) {
                if(tokenIsValid) { 
                // delete the checkData
                _data.delete('checks',id,function(err) {
                 if(!err) {
                // Lookup the user , we are looking into it becoz we want to remove the checks from the user object as well
                _data.read('users',checkData.userPhone,function(err,userData) {
                 if(!err && userData) {
                // does the userdata contain check with it  
                const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [] ;
                // Now remove the delete check from the list of checks
                const checkPosition = userChecks.indexOf(id);
                if(checkPosition > -1) {
                    userChecks.splice(checkPosition,1);
                    // Re-save the user data
                    _data.update('users',checkData.userPhone,userData,function(err) {
                        if(!err) {
                        callback(200);
                       }
                       else {
                        callback(500,{'Error' : 'Could not update the user '});
                       }
                    });
                } 
                else {
                    callback(500,{'Error':'Could not find the check on the user object, so could not remove it '});
                }
                
                }
                else {
                    callback(500,{'Error':'Could not find the user who created the check, so could not remove the check'});
                }
              });

    
       }
       else {
       callback(400,{'Error' : 'Could not delete the check data'});
       }
   });
}
        else {
          callback(403);
        } 
       });
  }
            
        else {
                callback(400,{'Error':'The specified id does not exist'});
            }
        });
    }
        else {
            callback(400,{'Error':'Missing Required fields'});
        }
     
};
     // NotFound handler   --- we no need to define in router as it is been called only when nothing matches in the router.
     handlers.notFound = function(data,callback) {
      callback(401);
     };

module.exports = handlers ;

// Authentication using Passport 
// Access Control 
// Cache Implementation --- Redis
// Event publication over websockets -- sockets.io
// TLS Security for the Rest API
// Elastic search 

/*Now understand the request handling in building Restful API i.e. how the requests are routed to respective handlers
     Understand in respect of API design   */ 

     const http = require('http');
     const url = require('url');
     const {StringDecoder} = require('string_decoder');
     const config = require('./lib/_configgg');
     const fs = require('fs');
     const handlers = require('./lib/handlers');
     const _data = require('./lib/data');
     
     
     const server = http.createServer(function(request, response){   //Callback function 
  
     const parsedUrl = url.parse(request.url,true);   //understand this 'true' passed here
   
     const path = parsedUrl.pathname;
     const trimmedPath = path.replace(/^\/+|\/+$/g,'');
     const queryStringObject = parsedUrl.query;
     const methods = request.method.toLowerCase();
     
     //4. Get the headers as an object 
     const headers = request.headers;
     //5. Get the Payload , if any
     const decoder = new StringDecoder('utf-8');  // Payload that comes with http request comein to the http server in the form of stream
     buffer = '';  //buffer instance   
     // request object emits the data event that we are binding to and sends the bunch of undecoded data 
     request.on('data',function(data) {   //when the request object emits the event data , we want to call this callback function to be called 
     
        buffer += decoder.write(data);  // and then buffer gets appended 
     });
     request.on('end',function() {
         buffer += decoder.end();   // buffer can not be the healthy practice here :: Security concern 
         
         const choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        // construct data object to be sent to the handler
         const data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'methods': methods,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };
        choosenHandler(data, function(statusCode,payload) {
        // use the statusCode called by respective handler or default to 200
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
        // use the payload called by respective handler or default to an empty object 
        payload = typeof(payload) == 'object' ? payload : {};

        // Now we want to send the user some payload that we are receiving from each handler, we will convert this payload into string
        const payloadString = JSON.stringify(payload); 

        // response to the user
        response.setHeader('Content-Type','application/json'); // Now the payload will look pretty in Postman { }
        response.writeHead(statusCode);
        response.end(payloadString);

        console.log('Returning this Response back to user :' +statusCode,+payloadString);
        });
         
        });
     
     });
     server.listen(config.port,function() {
     console.log("server is listening on "+config.port+ "port in" +config.envName+ "mode");
     });

     
     //define the request router     
     const router = {
         //'sample' : handlers.sample   //each path is unique so we chose router as an object 
         'ping' : handlers.ping,
         'users' : handlers.users,
         'tokens' : handlers.tokens,
         'checks' : handlers.checks
     };
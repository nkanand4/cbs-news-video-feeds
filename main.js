var http = require('http');
var defer = require("node-promise").defer;

var request = function(options) {
  var dfd = defer();
  var data = options.data ? options.data : undefined;
  delete options.data;
  var responseBody = '';
  var req = http.request(options, function(res) {
    if(res.statusCode !== 200) {
      dfd.isComplete = true;
      dfd.reject(res);
    }

    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      responseBody += chunk;
    });
    
    res.on('end', function (chunk) {
      if(!dfd.isComplete) {
        dfd.resolve(responseBody, res);
      }
    });

    res.on('error', function (chunk) {
        dfd.isComplete = true;
        dfd.reject(res);        
    });
    
  });

  req.on('error', function(e) {
    dfd.reject(e);
  });
  
  //write data to request body
  if(data) {
    req.write(data+'\n');
  }
  req.end();
  dfd.req = req;
  return dfd.promise;
};

module.exports = {
    request: request
};

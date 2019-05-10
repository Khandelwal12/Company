/* Library for storing and 
editing data
 */
//Dependency 

const fs = require('fs');
const path = require('path'); //Normalise the path to different directories

// Container for the module (to be exported)
const lib = {};

// base directory of the data folder
const baseDir = path.join(_dirname,'/../.data_fold/'); // _dirname: current directory i.e. 
//in this case you are inside lib folder and then moving back to the data folder.

// write data to a file 
lib.create = function (dir,file,data,callback) {
    // it is making error out if the file already exist
fs.open(lib.baseDir+dir+'/'+file+'.json','wx',function(err,fileDescriptor){  //filedecriptor 
    if(!err && fileDescriptor) {
     //convert data to string
     const stringData = JSON.stringify(data);
     //
     //write to file and close it
     fs.writeFile(fileDescriptor,stringData,function(err) {
         if(!err){
            // close the file
            fs.close(fileDescriptor,function(err) {
                if(!err) {
                    callback(false);
                }
                else 
                {
                    callback("Error in Closing the file");
                }
            });
         }
         else {
             callback("error writing to this file");
         }
     }); 
    }
    else {
        callback("Could not create new file, it may already exist");
    }
});
};

// Read data from a file 

lib.read = function(dir, file, callback) {
fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf-8',function(err,data){
callback(err, data);
});
};

// Update the existing file from new data

lib.update = function(dir,file,data,callback) {
    //Open the file for updating
fs.open(lib.baseDir+dir+'/'+file+'.json','r+',function(err,fileDescriptor) {
 if(!err && fileDescriptor) {
   const stringData = JSON.stringify(data);
// before writing this data to a file we need to truncate the file  
fs.truncate(fileDescriptor,function(err) {
 if(!err){
     //write to the file and close it 
     fs.writeFile(fileDescriptor, stringData,function(err) {
         if(!err) {
             // close the file 
             fs.close(fileDescriptor,function(err) {
              if(!err) {
                  callback(false);
              }
              else {
                  callback("Error in closing the file");
              }
             });
         }
         else {
             callback("Error Writing data to Existing file");
         }
     });
 }
 else {
     callback("Error Truncating the file");
 }
});
 }
 else {
  callback("Could not open the file for updating, it may not exist yet");
 }
});
};

// Delete a file 
lib.delete = function(dir,file,callback) {
  fs.unlink(lib.baseDir+dir+'/'+file+'.json',function(err) {
    if(!err) {
    callback(false);
    }
    else{
    callback("Error deleting the file");
    }
 });
};
//export the module
module.exports = lib; 
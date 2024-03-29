const { app, BrowserWindow, screen, ipcMain, net } = require('electron');
const { autoUpdater } = require('electron-updater');
const electron = require('electron');
const remote = require('electron').remote;
const url = require('url'); 
const path = require('path');
const { dialog } = require('electron');
const os = require('os');
const si = require('systeminformation');
const mysql = require('mysql');
const ip = require('ip');
const { session } = require('electron');
const osu = require('node-os-utils');
const request = require("request");
const cron = require('node-cron'); 
const fs = require("fs");
const log = require("electron-log");
const exec = require('child_process').exec;
const AutoLaunch = require('auto-launch');
const nodeDiskInfo = require('node-disk-info');
const mv = require('mv'); 
const uuid = require('node-machine-id');
const csv = require('csvtojson');
const serialNumber = require('serial-number');
const shell = require('node-powershell');
const { spawn } = require('child_process');
const child_process = require('child_process');

const notifier = require('node-notifier'); // temp
const { Console } = require('console');

const Tray = electron.Tray;
const iconPath = path.join(__dirname,'images/fav-icon.png');
const versionItam = '1.0.9';

const chokidar = require('chokidar');
const getmac = require('getmac');

//global.root_url = 'https://developer.eprompto.com/itam_backend_end_user';

//global.root_url = 'http://localhost/business_eprompto/itam_backend_end_user';
//global.root_url = 'https://business.eprompto.com/itam_backend_end_user';
// global.root_url = 'https://developer.eprompto.com/itam_backend_end_user';

// global.root_url = 'http://localhost/end_user_backend';
// global.root_url = 'http://localhost/eprompto_master';

// global.root_url = 'https://developer.eprompto.com/itam_backend_end_user';
// server_url = 'https://developer.eprompto.com';


global.root_url = 'https://business.eprompto.com/itam_backend_end_user';
server_url = 'https://business.eprompto.com';

 //Local Url
// global.root_url = 'http://localhost/business_eprompto/itam_backend_end_user';
// server_url = 'http://localhost/business_eprompto';

let reqPath = path.join(app.getAppPath(), '../');
const detail =  reqPath+"syskey.txt";
//var csvFilename = reqPath + 'utilise.csv';
var time_file = reqPath + 'time_file.txt';

let mainWindow;
let categoryWindow;
let settingWindow;
let display;
let width;
let startWindow;
let tabWindow;
let child;
let ticketIssue;
let policyWindow;

let tray = null;
let count = 0;
var crontime_array = [];
var updateDownloaded = false;

let loginWindow;
let regWindow;
let forgotWindow;
let ticketWindow;
let quickUtilWindow;

app.commandLine.appendSwitch('disable-features', 'WindowsSearch');
app.on('ready',function(){

    app.setUserTasks([]);

    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
    }
    
        
    tray = new Tray(iconPath);

    log.transports.file.level = 'info';
    log.transports.file.maxSize = 5 * 1024 * 1024;
    log.transports.file.file = reqPath + '/log.log';
    log.transports.file.streamConfig = { flags: 'a' };
    log.transports.file.stream = fs.createWriteStream(log.transports.file.file, log.transports.file.streamConfig);
    log.transports.console.level = 'debug';
    
        session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
        .then((cookies) => {
          console.log(cookies);
          if(cookies.length == 0){
            if(fs.existsSync(detail)){
              fs.readFile(detail, 'utf8', function (err,data) {
              if (err) {
                return console.log(err);
              }
              
               var stats = fs.statSync(detail);
               var fileSizeInBytes = stats["size"];
               if(fileSizeInBytes > 0){
                   const cookie = {url: 'http://www.eprompto.com', name: data, value: '', expirationDate: 99999999999}
                 session.defaultSession.cookies.set(cookie, (error) => {
                  if (error) console.error(error)
                 })
               }
            });
            }
          }else{
            if(fs.existsSync(detail)) {
               var stats = fs.statSync(detail);
             var fileSizeInBytes = stats["size"];
             if(fileSizeInBytes == 0){
                  fs.writeFile(detail, cookies[0].name, function (err) { 
                if (err) return console.log(err);                
              });
             }
            } else {
                fs.writeFile(detail, cookies[0].name, function (err) { 
              if (err) return console.log(err);
            });
            }
             
          }

          fs.access("C:/ITAMEssential", function(error) {
            if (error) {
              fs.mkdir("C:/ITAMEssential", function(err) {
                if (err) {
                  console.log(err)
                } else {                  
                   console.log("Created folder C:/ITAMEssential");
                   fs.mkdir("C:/ITAMEssential/EventLogCSV", function(err) {
                    if (err) {
                      console.log(err)
                    } else {
                      console.log("Created folder C:/ITAMEssential/EventLogCSV");               
                      checkforbatchfile_FirstTime();
                    }
                  })
                }
              })
            } else {
              console.log("Base Folder Exists");
            }
          });
          console.log(cookies[0].name);
          SetCron(cookies[0].name); // to fetch utilisation
          
          checkSecuritySelected(cookies[0].name); //to fetch security detail
        }).catch((error) => {
          console.log(error)
        })

        let autoLaunch = new AutoLaunch({
          name: 'ABC Com',
        });
        autoLaunch.isEnabled().then((isEnabled) => {
          if (!isEnabled) autoLaunch.enable();
        });


      var now_datetime = new Date();
      var options = { hour12: false, timeZone: "Asia/Kolkata" };
      now_datetime = now_datetime.toLocaleString('en-US', options);
      var only_date = now_datetime.split(", ");

        fs.writeFile(time_file, now_datetime, function (err) { 
        if (err) return console.log(err);
      });

      setGlobalVariable();  
      
      // session.defaultSession.clearStorageData([], function (data) {
      //     console.log(data);
      // })


  }); 

app.commandLine.appendSwitch('ignore-certificate-errors') // COMMENT THIS OUT
app.commandLine.appendSwitch('disable-http2');
autoUpdater.requestHeaders = {'Cache-Control' : 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'};

function checkSecuritySelected(system_key){
  console.log("Inside checkSecuritySelected");
  require('dns').resolve('www.google.com', function(err) {
    if (err) {
       console.log("No connection");
    } else {
      var body = JSON.stringify({ "funcType": 'checkSecuritySelected', "sys_key": system_key }); 
      const request = net.request({ 
          method: 'POST', 
          url: root_url+'/security.php' 
      }); 
      request.on('response', (response) => {
          console.log(`STATUS: ${response.statusCode}`)
          response.on('data', (chunk) => {
            console.log(`${chunk}`);
            if (chunk) {
              let a;
              try {
                var obj = JSON.parse(chunk);
                console.log("Past checkSecuritySelected Json.parse chunk"); // comment
                if(obj.status == 'valid'){
                  var asset_id = obj.asset_id;
                  var last_update = obj.last_date;
                  console.log("AT ACCESS"); // comment out
                  fs.access("C:/ITAMEssential", function(error) {
                    if (error) {
                      console.log("AT MAKE DIR"); // comment out
                      fs.mkdir("C:/ITAMEssential", function(err) {
                        if (err) {
                          console.log(err)
                        } else {
                          console.log("AT MAKE EVENTLOGCSV") // comment out
                          fs.mkdir("C:/ITAMEssential/EventLogCSV", function(err) {
                            if (err) {
                              console.log(err)
                            } else {
                              checkforbatchfile(last_update);
                            }
                          })
                        }
                      })
                    } else {
                      checkforbatchfile(last_update);
                    }
                  })

                  fetchEventlogData(asset_id,system_key,last_update); 
                }
                
              } catch (e) {
                  return console.log('checkSecuritySelected: No proper response received'); // error in the above string (in this case, yes)!
              }
             } 
          })
          response.on('end', () => {})
      })
      request.on('error', (error) => { 
          console.log(`ERROR: ${(error)}`) 
      })
      request.setHeader('Content-Type', 'application/json'); 
      request.write(body, 'utf-8'); 
      request.end();
    }
  });
}
app.setAppUserModelId('com.eprompto.business.abcom.itam');
function checkforbatchfile(last_update){
  const path1 = 'C:/ITAMEssential/logadmin.bat';
  const path2 = 'C:/ITAMEssential/execScript.bat';
  const path3 = 'C:/ITAMEssential/copy.ps1';

  if (!fs.existsSync(path1)) {
    fs.writeFile(path1, '@echo off'+'\n'+'runas /profile /user:itam /savecred "c:\\ITAMEssential\\execScript.bat"', function (err) {
      if (err) throw err;
      console.log('File1 is created successfully.');
    });
  }

  if (!fs.existsSync(path2)) {
    fs.writeFile(path2, '@echo off'+'\n'+'START /MIN c:\\windows\\system32\\WindowsPowerShell\\v1.0\\powershell.exe -onionpolicy bypass c:\\ITAMEssential\\copy.ps1', function (err) {
      if (err) throw err;
      console.log('File2 is created successfully.');
    });
  }

  var command = '$aDateTime = [dateTime]"'+last_update+'"'+'\n'+'Get-EventLog -LogName Security -After ($aDateTime) -Before (Get-Date)  | Export-Csv -Path C:\\ITAMEssential\\EventLogCSV\\securitylog.csv'

    fs.writeFile(path3, command, function (err) {
      if (err) throw err;
      console.log('File3 is created successfully.');
    });
}


function checkforbatchfile_FirstTime(){
  const path1 = 'C:/ITAMEssential/logadmin.bat';
  const path2 = 'C:/ITAMEssential/execScript.bat';
  const path3 = 'C:/ITAMEssential/copy.ps1';
  if (!fs.existsSync(path1)) {
    fs.writeFile(path1, '@echo off'+'\n'+'runas /profile /user:itam /savecred "c:\\ITAMEssential\\execScript.bat"', function (err) {
      if (err) throw err;
      console.log('File1 is created successfully.');
    });
  }
  if (!fs.existsSync(path2)) {
    fs.writeFile(path2, '@echo off'+'\n'+'START /MIN c:\\windows\\system32\\WindowsPowerShell\\v1.0\\powershell.exe -executionpolicy bypass c:\\ITAMEssential\\copy.ps1', function (err) {
      if (err) throw err;
      console.log('File2 is created successfully.');
    });
  }
  var command = '$aDateTime = [dateTime](Get-Date).AddDays(-1)'+'\n'+'Get-EventLog -LogName Security -After ($aDateTime) -Before (Get-Date)  | Export-Csv -Path C:\\ITAMEssential\\EventLogCSV\\securitylog.csv'
    fs.writeFile(path3, command, function (err) {
      if (err) throw err;
      console.log('File3 is created successfully.');
    });
}

function fetchEventlogData(assetid,system_key,last_update){

  require('dns').resolve('www.google.com', function(err) {
    if (err) {
       console.log("No connection");
    } else {
       var body = JSON.stringify({ "funcType": 'getSecurityCrontime', "sys_key": system_key }); 
        const request = net.request({ 
            method: 'POST', 
            url: root_url+'/security.php' 
        }); 
        request.on('response', (response) => {
            //console.log(`STATUS: ${response.statusCode}`)
            response.on('data', (chunk) => {
              //console.log(`${chunk}`);
              if (chunk) {
                let a;
                try {
                  var obj = JSON.parse(chunk);
                  if(obj.status == 'valid'){
                    security_crontime_array = obj.result; 
                    security_crontime_array.forEach(function(slot){ 
                      cron.schedule("0 "+slot[1]+" "+slot[0]+" * * *", function() { 
                          session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
                            .then((cookies) => {
                              if(cookies.length > 0){

                                child_process.exec('C:\\ITAMEssential\\logadmin', function(error, stdout, stderr) {
                                      console.log(stdout);
                                  });
                              
                                getEventIds('System',assetid,function(events){
                                  var command = '$aDateTime = [dateTime]"'+last_update+'"'+'\n'+'Get-EventLog -LogName System -InstanceId '+events+' -After ($aDateTime) -Before (Get-Date)  | Export-Csv -Path C:\\ITAMEssential\\EventLogCSV\\systemlog.csv';
                                  //var command = 'Get-EventLog -LogName System -InstanceId '+events+' -After ([datetime]::Today)| Export-Csv -Path C:\\ITAMEssential\\EventLogCSV\\systemlog.csv';
                                  exec(command, {'shell':'powershell.exe'}, (error, stdout, stderr)=> {
                                      console.log(stdout);
                                  })
                                });

                                getEventIds('Application',assetid,function(events){
                                  var command = '$aDateTime = [dateTime]"'+last_update+'"'+'\n'+'Get-EventLog -LogName Application -InstanceId '+events+' -After ($aDateTime) -Before (Get-Date)  | Export-Csv -Path C:\\ITAMEssential\\EventLogCSV\\applog.csv';
                                  //var command = 'Get-EventLog -LogName Application -InstanceId '+events+' -After ([datetime]::Today)| Export-Csv -Path C:\\ITAMEssential\\EventLogCSV\\applog.csv';
                                  exec(command, {'shell':'powershell.exe'}, (error, stdout, stderr)=> {
                                      console.log(stdout);
                                  })
                                });
                              }
                            }).catch((error) => {
                              console.log(error)
                            })
                          }, {
                            scheduled: true,
                            timezone: "Asia/Kolkata" 
                        });
                      

                        var minute = Number(slot[1])+Number(4); 
                        if(minute > 59){
                          slot[0] = Number(slot[0])+Number(1);
                          minute = Number(minute) - Number(60);
                        }

                        cron.schedule("0 "+minute+" "+slot[0]+" * * *", function() { 
                          session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
                            .then((cookies) => {
                              if(cookies.length > 0){
                                //read from csv
                                  try {
                                    if (fs.existsSync('C:/ITAMEssential/EventLogCSV/securitylog.csv')) {
                                      readSecurityCSVFile('C:\\ITAMEssential\\EventLogCSV\\securitylog.csv',system_key);
                                    }
                                  } catch(err) {
                                    console.error(err)
                                  }

                                  try {
                                    if (fs.existsSync('C:/ITAMEssential/EventLogCSV/systemlog.csv')) {
                                      readCSVFile('C:\\ITAMEssential\\EventLogCSV\\systemlog.csv',system_key);
                                    }
                                  } catch(err) {
                                    console.error(err)
                                  }

                                  try {
                                    if (fs.existsSync('C:/ITAMEssential/EventLogCSV/applog.csv')) {
                                      readCSVFile('C:\\ITAMEssential\\EventLogCSV\\applog.csv',system_key);
                                    }
                                  } catch(err) {
                                    console.error(err)
                                  }
                              }
                            }).catch((error) => {
                              console.log(error)
                            })
                          }, {
                            scheduled: true,
                            timezone: "Asia/Kolkata" 
                        });
                    });
                  }
                  
                  
                } catch (e) {
                    return console.log('getSecurityCrontime: No proper response received'); // error in the above string (in this case, yes)!
                }
               } 
            })
            response.on('end', () => {})
        })
        request.on('error', (error) => { 
            console.log(`ERROR: ${(error)}`) 
        })
        request.setHeader('Content-Type', 'application/json'); 
        request.write(body, 'utf-8'); 
        request.end();
    }
  });
}

function readSecurityCSVFile(filepath,system_key){ 
   //var main_arr=[];
   var final_arr=[];
   var new_Arr = [];
   var ultimate = [];
   const converter=csv()
    .fromFile(filepath)
    .then((json)=>{
        if(json != []){
           for (j = 1; j < json.length; j++) {  
              // if(json[j]['field12'] == 'Security' ){  
                if(final_arr.indexOf(json[j]['field11']) == -1 && final_arr.indexOf(json[j]['field12']) == -1){ //to avoid duplicate entry into the array
                    final_arr.push(json[j]['field11'],json[j]['field12']);
                    new_Arr = [json[j]['field11'],json[j]['field12']];
                    ultimate.push(new_Arr);
                }
              //}
           }

            require('dns').resolve('www.google.com', function(err) {
              if (err) {
                 console.log("No connection");
              } else {
                  var body = JSON.stringify({ "funcType": 'addsecuritywinevent', "sys_key": system_key, "events": ultimate }); 
                  const request = net.request({ 
                      method: 'POST', 
                      url: root_url+'/security.php' 
                  }); 
                  request.on('response', (response) => {
                      //console.log(`STATUS: ${response.statusCode}`)
                      response.on('data', (chunk) => {
                        console.log(`${chunk}`);
                      })
                      response.on('end', () => {})
                  })
                  request.on('error', (error) => { 
                      console.log(`ERROR: ${(error)}`) 
                  })
                  request.setHeader('Content-Type', 'application/json'); 
                  request.write(body, 'utf-8'); 
                  request.end();
              }
            }); 
        }
    })
}

function readCSVFile(filepath,system_key){
   var final_arr=[];
   var new_Arr = [];
   var ultimate = [];
   const converter=csv()
    .fromFile(filepath)
    .then((json)=>{ 
        if(json != []){ 
           for (j = 1; j < json.length; j++) { 
              if(final_arr.indexOf(json[j]['field11']) == -1){ //to avoid duplicate entry into the array
                  final_arr.push(json[j]['field11']);
                  new_Arr = [json[j]['field11'],json[j]['field12']];
                  ultimate.push(new_Arr);
              }
           }
           require('dns').resolve('www.google.com', function(err) {
              if (err) {
                 console.log("No connection");
              } else {
                  var body = JSON.stringify({ "funcType": 'addwinevent', "sys_key": system_key, "events": ultimate }); 
                  const request = net.request({ 
                      method: 'POST', 
                      url: root_url+'/security.php' 
                  }); 
                  request.on('response', (response) => {
                      //console.log(`STATUS: ${response.statusCode}`)
                      response.on('data', (chunk) => {
                        //console.log(`${chunk}`);
                      })
                      response.on('end', () => {})
                  })
                  request.on('error', (error) => { 
                      console.log(`ERROR: ${(error)}`) 
                  })
                  request.setHeader('Content-Type', 'application/json'); 
                  request.write(body, 'utf-8'); 
                  request.end();
              }
            });  
        }
    })
}

var getEventIds = function(logname,asset_id,callback) { 
  var events = '';
  require('dns').resolve('www.google.com', function(err) {
    if (err) {
       console.log("No connection");
    } else {
      var body = JSON.stringify({ "funcType": 'getEventId', "lognametype": logname, "asset_id": asset_id }); 
      const request = net.request({ 
          method: 'POST', 
          url: root_url+'/security.php' 
      }); 
      request.on('response', (response) => {
          //console.log(`STATUS: ${response.statusCode}`)
          response.on('data', (chunk) => {
            //console.log(`${chunk}`);
            
            if (chunk) {
              let a;
              try {
                var obj = JSON.parse(chunk);
                if(obj.status == 'valid'){
                  if(obj.result.length > 0){
                    for (var i = 0; i < obj.result.length-1 ; i++) {
                      events = events + obj.result[i]+',';
                    }
                    events = events + obj.result[obj.result.length-1];
                  }
                  callback(events);
                }
                
              } catch (e) {
                  return console.log('getEventId: No proper response received'); // error in the above string (in this case, yes)!
              }
             } 
          })
          response.on('end', () => {})
      })
      request.on('error', (error) => { 
          console.log(`ERROR: ${(error)}`) 
      })
      request.setHeader('Content-Type', 'application/json'); 
      request.write(body, 'utf-8'); 
      request.end();
    }
  });
}

function SetCron(sysKey){

  var body = JSON.stringify({ "funcType": 'crontime', "syskey": sysKey }); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/main.php' 
  }); 
  request.on('response', (response) => {
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
       console.log("ITAM CRON TIME IS"+`${chunk}`);
        if (chunk) {
          let a;
          try {
            var obj = JSON.parse(chunk);
            if(obj.status == 'valid'){
              crontime_array = obj.result;
              crontime_array.forEach(function(slot){ 
                cron.schedule("0 "+slot[0]+" "+slot[1]+" * * *", function() { 
                session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
                  .then((cookies) => {
                    if(cookies.length > 0){
                      slot_time = slot[1]+':'+slot[0];
                      updateAssetUtilisation(slot_time);
                    }
                  }).catch((error) => {
                    console.log(error)
                  })
                }, {
                  scheduled: true,
                  timezone: "Asia/Kolkata" 
              });
              });
            }
                  
          } catch (e) {
              return console.log('crontime: No proper response received'); // error in the above string (in this case, yes)!
          }
         } 
      })
      response.on('end', () => {})
  })
  request.on('error', (error) => { 
      console.log(`ERROR: ${(error)}`) 
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();
}

function setGlobalVariable(){
  tray.destroy();
  tray = new Tray(iconPath);
  display = electron.screen.getPrimaryDisplay();
  width = display.bounds.width;

  si.system(function(data) {
    sys_OEM = data.manufacturer;
    sys_model = data.model;
    global.Sys_name = sys_OEM+' '+sys_model;
  });

  session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
    .then((cookies) => { 
      if(cookies.length > 0){ 
        require('dns').resolve('www.google.com', function(err) {
        if (err) {
           console.log("No connection");
           global.NetworkStatus = 'No';
        } else {
          console.log("CONNECTED");
          global.NetworkStatus = 'Yes';

          var body = JSON.stringify({ "funcType": 'openFunc', "sys_key": cookies[0].name }); 
          const request = net.request({ 
              method: 'POST', 
              url: root_url+'/main.php' 
          }); 
          request.on('response', (response) => {
              //console.log(`STATUS: ${response.statusCode}`)
              response.on('data', (chunk) => { 
                //console.log(`${chunk}`); 
                if (chunk) {
                  let a;
                  try {
                    var obj = JSON.parse(chunk);
                    if(obj.status == 'valid'){
                      asset_id = obj.result[0];
                      client_id = obj.result[1];
                      global.clientID = client_id;
                      global.NetworkStatus = 'Yes';
                      global.downloadURL = __dirname;
                      global.assetID = asset_id;
                      global.deviceID = obj.result[2];
                      global.userName = obj.loginPass[0];
                      global.loginid = obj.loginPass[1];
                      global.sysKey = cookies[0].name;
                     // updateAsset(asset_id);
                      softwareDetails();
                      hardwareDetails();
                      keyboardDetails();
                      mouseDetails();
                      graphicCardDetails();
                      motherboardDetails();
                      monitorDetails();
                      monitorInchesScreen();
                      //SetCron(cookies[0].name);
                      //addAssetUtilisation(asset_id,client_id);
                    }
                    
                  } catch (e) {
                      return console.log('openFunc: No proper response received'); // error in the above string (in this case, yes)!
                  }
                 } 
              })
              response.on('end', () => {})
          })
          request.on('error', (error) => { 
             log.info('Error while fetching global data '+error); 
          })
          request.setHeader('Content-Type', 'application/json'); 
          request.write(body, 'utf-8'); 
          request.end();
        }
      });


      // Old ITAM UI dimensions:
      // mainWindow = new BrowserWindow({
      //   width: 392,
      //   height: 520,
      //   icon: __dirname + '/images/fav-icon.png',
      //   titleBarStyle: 'hiddenInset',
      //   frame: false,
      //   x: width - 450,
      //   y: 190,
      //   webPreferences: {
      //           nodeIntegration: true,
      //           enableRemoteModule: true,
      //       }
      // });

      //New ITAM UI dimensions:
      mainWindow = new BrowserWindow({
        // width: 392,
        // width: 370,
        width: 277,
        // height: 520,
        height: 250,
        icon: __dirname + '/images/fav-icon.png',
        titleBarStyle: 'hiddenInset',
        frame: false,
        resizable:false,
        transparent:true,        
        // x: width - 450,
        x: width - 300,
        // y: 190
        y: 440,
        webPreferences: {
                nodeIntegration: true,
                enableRemoteModule: true,    
            },
        //skipTaskbar: true    
      });
      
     // mainWindow.hide();
      mainWindow.setMenuBarVisibility(false);

      mainWindow.loadURL(url.format({
        pathname: path.join(__dirname,'index.html'),
        protocol: 'file:',
        slashes: true
      }));

        mainWindow.once('ready-to-show', () => {
        autoUpdater.checkForUpdates();
        // autoUpdater.checkForUpdatesAndNotify();
        // autoUpdater.onUpdateAvailable();
      });

      const gotTheLock = app.requestSingleInstanceLock();
      if (!gotTheLock) {
        app.quit();
      }

      tray.on('click', function(e){
          if (mainWindow.isVisible()) {
            mainWindow.hide();
           
          } else {
            mainWindow.hide();
           
          }
          
      });
     

      mainWindow.on('close', function (e) {
        if (process.platform !== "darwin") {
          app.quit();
        }
        // // if (electron.app.isQuitting) {
        // //  return
        // // }
        // e.preventDefault();
        // mainWindow.hide();
        // // if (child.isVisible()) {
        // //     child.hide()
        // //   } 
        // //mainWindow = null;
       });
      
      //mainWindow.on('closed', () => app.quit());
      }
      else{
        startWindow = new BrowserWindow({
        width: 392,
        height: 520,
        icon: __dirname + '/images/fav-icon.png',
        //frame: false,
        x: width - 430,
            y: 190,
        webPreferences: {
                nodeIntegration: true,
                enableRemoteModule: true,
            },
         //   skipTaskbar: true      
      });
      
      startWindow.setMenuBarVisibility(false);

      startWindow.loadURL(url.format({
        pathname: path.join(__dirname,'login.html'),
        protocol: 'file:',
        slashes: true
      }));
      }
    }).catch((error) => {
      console.log(error)
    })    
}



function updateAssetUtilisation(slot){
  
  const cpu = osu.cpu;
  var active_user_name = "";
  var ctr = 0;
  var app_list = [];
  const data = [];
  var app_name_list = "";
  var time_off = "";
  var avg_ctr; 
  var avg_cpu = 0;
  var avg_hdd = 0;
  var avg_ram = 0;

  var todays_date = new Date();
  todays_date = todays_date.toISOString().slice(0,10);

  if(fs.existsSync(time_file)) { 
       var stats = fs.statSync(time_file); 
     var fileSizeInBytes = stats["size"]; 
     if(fileSizeInBytes > 0){
        fs.readFile(time_file, 'utf8', function (err,data) {
          if (err) {
            return console.log(err);
          }
          time_off = data;
        });
     }
    }

  session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
    .then((cookies1) => {

    const disks = nodeDiskInfo.getDiskInfoSync();
    total_ram = (os.totalmem()/(1024*1024*1024)).toFixed(1); // total RAM
    free_ram = (os.freemem()/(1024*1024*1024)).toFixed(1); // free RAM
      //tot_mem = (os.totalmem()/(1024*1024*1024)).toFixed(1);
      //utilised_RAM = tot_mem - free_mem; // in GB
    today = Math.floor(Date.now() / 1000);
    utilised_RAM = (((total_ram - free_ram)/total_ram)*100).toFixed(1); // % RAM used

    //used_mem = ((os.totalmem() - os.freemem())/(1024*1024*1024)).toFixed(1);
    hdd_total = hdd_used = 0;
    hdd_name = '';
    for (const disk of disks) {
         if(disk.filesystem == 'Local Fixed Disk'){
           hdd_total = hdd_total + disk.blocks;
           hdd_used = hdd_used + disk.used;
           //free_drive = ((disk.available - disk.used)/(1024*1024*1024)).toFixed(2);
           used_drive = (disk.used/(1024*1024*1024)).toFixed(2); // disk used in GB
           hdd_name = hdd_name.concat(disk.mounted+' '+used_drive+' / ');
       }
          
      }

      hdd_total = hdd_total/(1024*1024*1024);
      hdd_used = hdd_used/(1024*1024*1024);

    Get_Browser_History_Powershell_Script('Get_Browser_History');

    cpu.usage()
      .then(info => { 
      // info is nothing but CPU utilisation in %
          if(info == 0){
            info = 1; 
          }
          getAppUsedList(function(app_data){
            app_name_list = app_data;             
            setTimeout(function(){
              CallUpdateAssetApi(cookies1[0].name,todays_date,slot,info,utilised_RAM,hdd_used,ctr,active_user_name,app_name_list,utilised_RAM,info,hdd_used,total_ram,hdd_total,hdd_name,time_off);           
            },15000); // 15secs
          });
    })
  }).catch((error) => {
      console.log(error)
  })    
}

function CallUpdateAssetApi(sys_key,todays_date,slot,cpu_used,ram_used,hdd_used,active_usr_cnt,active_usr_nm,app_name_list,csv_ram_util,info,hdd_used,total_mem,hdd_total,hdd_name,time_off){
  
  var filepath1 = 'C:\\ITAMEssential\\EventLogCSV\\BrowserData.csv';    
  newFilePath = filepath1;
  
  if (fs.existsSync(newFilePath)) {
    var final_arr=[];
    var new_Arr = [];
    var ultimate = [];
    const converter=csv({noheader: true,output:"line"})
    .fromFile(newFilePath)      
    .then((json)=>{
      
        if(json != []){  
          console.log(json);                    

            var body = JSON.stringify({ "funcType": 'addassetUtilisation', "sys_key": sys_key, "browser_data":json , "cpu_util": cpu_used, "slot": slot, "ram_util": ram_used,
            "total_mem": total_mem, "hdd_total" : hdd_total, "hdd_used" : hdd_used, "hdd_name" : hdd_name, "app_used": app_name_list, "timeoff": time_off }); 
          const request = net.request({ 
              method: 'POST', 
              url: root_url+'/asset.php' 
          }); 
          request.on('response', (response) => {
              //console.log(`STATUS: ${response.statusCode}`)
              response.on('data', (chunk) => {
                console.log(`${chunk}`);
                
                if (chunk) {
                  let a;
                  try {
                    var obj = JSON.parse(chunk);
                    if(obj.status == 'invalid'){ 
                      log.info('Error while updating asset detail 1');
                    }else{
                      log.info('Updated asset detail successfully 1');
                    }
                    
                  } catch (e) {
                      return console.log('addassetUtilisation: No proper response received'); // error in the above string (in this case, yes)!
                  }
                 } 
              })
              response.on('end', () => {
                // if (newFilePath != "" ){ // if filepath has been passed and uploading done
                //   fs.unlinkSync(newFilePath); // This deletes the created csv
                //   console.log("BrowserData File Unlinked");
                // }
              })
          })
          request.on('error', (error) => { 
              console.log(`ERROR: ${(error)}`) 
          })
          request.setHeader('Content-Type', 'application/json'); 
          request.write(body, 'utf-8'); 
          request.end();
        }
    })
  }else{
    var body = JSON.stringify({ "funcType": 'addassetUtilisation', "sys_key": sys_key, "cpu_util": cpu_used, "slot": slot, "ram_util": ram_used,
      "total_mem": total_mem, "hdd_total" : hdd_total, "hdd_used" : hdd_used, "hdd_name" : hdd_name, "app_used": app_name_list, "timeoff": time_off }); 
    const request = net.request({ 
        method: 'POST', 
        url: root_url+'/asset.php' 
    }); 
    request.on('response', (response) => {
        //console.log(`STATUS: ${response.statusCode}`)
        response.on('data', (chunk) => {
          //console.log(`${chunk}`);
         if (chunk) {
            let a;
            try {
              var obj = JSON.parse(chunk);
              if(obj.status == 'invalid'){ 
                log.info('Error while updating asset detail 2');
              }else{
                log.info('Updated asset detail successfully 2');
              }
              
            } catch (e) {
                return console.log('addassetUtilisation: No proper response received'); // error in the above string (in this case, yes)!
            }
           } 
        })
        response.on('end', () => {})
    })
    request.on('error', (error) => { 
        console.log(`ERROR: ${(error)}`) 
    })
    request.setHeader('Content-Type', 'application/json'); 
    request.write(body, 'utf-8'); 
    request.end();
  }
}

var getAppUsedList = function(callback) {
  var app_name_list  = "";
  var app_list = [];

  exec('tasklist /nh', function(err, stdout, stderr) {
    res = stdout.split('\n'); 
    res.forEach(function(line) {
       line = line.trim();
       var newStr = line.replace(/  +/g, ' ');
        var parts = newStr.split(' ');
        if(app_list.indexOf(parts[0]) == -1){ //to avoid duplicate entry into the array
            app_list.push(parts[0]);
        }
    });
    var j;
    for (j = 0; j < app_list.length; j++) { 
      //if(app_list[j] == 'EXCEL.EXE' || app_list[j] == 'wordpad.exe' || app_list[j] == 'WINWORD.EXE' || app_list[j] == 'tally.exe' ){
        app_name_list += app_list[j] + " / ";
      //}
    }
    callback(app_name_list);
    //console.log(output);
  });
};

function readCSVUtilisation(){
  //var inputPath = reqPath + '/utilise.csv';

  var current_date = new Date();
  var month = current_date.getMonth()+ 1;
  var day = current_date.getDate();
  var year = current_date.getFullYear();
    current_date = day+'-0'+month+'-'+year; //change the format as per excel to compare thee two dates

    first_active_usr_cnt = sec_active_usr_cnt = third_active_usr_cnt = frth_active_usr_cnt = '';
  first_active_usrname = sec_active_usrname = third_active_usrname = frth_active_usrname = '';
  first_app_used = sec_app_used = third_app_used = frth_app_used = '';

  first_avg_ctr = first_avg_cpu = first_avg_ram = first_avg_hdd = 0;
  sec_avg_ctr = sec_avg_cpu = sec_avg_ram = sec_avg_hdd = 0;
  third_avg_ctr = third_avg_cpu = third_avg_ram = third_avg_hdd = 0;
  frth_avg_ctr = frth_avg_cpu = frth_avg_ram = frth_avg_hdd = 0;

  var csv_array = [];

  session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
    .then((cookies) => {
        require_path = reqPath + 'utilise.csv';
             
      if (fs.existsSync(require_path)){ 
        const converter=csv()
        .fromFile(reqPath + '/utilise.csv')
        .then((json)=>{
          if(json != []){

            for (j = 0; j < json.length; j++) {
              if(json[j]['date'] == current_date ){ 
                if(json[j]['time_slot'] == 'first'){ 
                  first_avg_ctr = Number(first_avg_ctr) + 1; 
                  first_avg_cpu = first_avg_cpu + Number(json[j]['cpu']);
                  first_avg_ram = first_avg_ram + Number(json[j]['ram']);
                  first_avg_hdd = first_avg_hdd + Number(json[j]['hdd']);
                  first_active_usr_cnt = json[j]['active_user'];
                  first_active_usrname = json[j]['active_user_name'];
                  first_app_used = json[j]['app_used'];

                }else if(json[j]['time_slot'] == 'second'){ 
                  sec_avg_ctr = Number(sec_avg_ctr) + 1; 
                  sec_avg_cpu = sec_avg_cpu + Number(json[j]['cpu']);
                  sec_avg_ram = sec_avg_ram + Number(json[j]['ram']);
                  sec_avg_hdd = sec_avg_hdd + Number(json[j]['hdd']);
                  sec_active_usr_cnt = json[j]['active_user'];
                  sec_active_usrname = json[j]['active_user_name'];
                  sec_app_used = json[j]['app_used'];
                }else if(json[j]['time_slot'] == 'third'){ 
                  third_avg_ctr = Number(third_avg_ctr) + 1; 
                  third_avg_cpu = third_avg_cpu + Number(json[j]['cpu']);
                  third_avg_ram = third_avg_ram + Number(json[j]['ram']);
                  third_avg_hdd = third_avg_hdd + Number(json[j]['hdd']);
                  third_active_usr_cnt = json[j]['active_user'];
                  third_active_usrname = json[j]['active_user_name'];
                  third_app_used = json[j]['app_used'];
                }else if(json[j]['time_slot'] == 'fourth'){ 
                  frth_avg_ctr = Number(frth_avg_ctr) + 1; 
                  frth_avg_cpu = frth_avg_cpu + Number(json[j]['cpu']);
                  frth_avg_ram = frth_avg_ram + Number(json[j]['ram']);
                  frth_avg_hdd = frth_avg_hdd + Number(json[j]['hdd']);
                  frth_active_usr_cnt = json[j]['active_user'];
                  frth_active_usrname = json[j]['active_user_name'];
                  frth_app_used = json[j]['app_used'];
                }

                csv_array['date'] = json[j]['date'];
              }

            }

            if(first_avg_ctr != 0){

              first_avg_cpu = first_avg_cpu/first_avg_ctr;
              first_avg_ram = first_avg_ram/first_avg_ctr;
              first_avg_hdd = first_avg_hdd/first_avg_ctr;

              csv_array['first'] = {
                time_slot : 'first',
                cpu : first_avg_cpu,
                ram : first_avg_ram,
                hdd : first_avg_hdd,
                active_user : first_active_usr_cnt,
                active_user_name : first_active_usrname,
                app_used : first_app_used
              }
            }
            

            if(sec_avg_ctr != 0){

              sec_avg_cpu = sec_avg_cpu/sec_avg_ctr;
              sec_avg_ram = sec_avg_ram/sec_avg_ctr;
              sec_avg_hdd = sec_avg_hdd/sec_avg_ctr;

              csv_array['second'] = {
                time_slot : 'second',
                cpu : sec_avg_cpu,
                ram : sec_avg_ram,
                hdd : sec_avg_hdd,
                active_user : sec_active_usr_cnt,
                active_user_name : sec_active_usrname,
                app_used : sec_app_used
              }
            }

            if(third_avg_ctr != 0){

              third_avg_cpu = third_avg_cpu/third_avg_ctr;
              third_avg_ram = third_avg_ram/third_avg_ctr;
              third_avg_hdd = third_avg_hdd/third_avg_ctr;

              csv_array['third'] = {
                time_slot : 'third',
                cpu : third_avg_cpu,
                ram : third_avg_ram,
                hdd : third_avg_hdd,
                active_user : third_active_usr_cnt,
                active_user_name : third_active_usrname,
                app_used : third_app_used
              }
            }

            if(frth_avg_ctr != 0){

              frth_avg_cpu = frth_avg_cpu/frth_avg_ctr;
              frth_avg_ram = frth_avg_ram/frth_avg_ctr;
              frth_avg_hdd = frth_avg_hdd/frth_avg_ctr;

              csv_array['fourth'] = {
                time_slot : 'fourth',
                cpu : frth_avg_cpu,
                ram : frth_avg_ram,
                hdd : frth_avg_hdd,
                active_user : frth_active_usr_cnt,
                active_user_name : frth_active_usrname,
                app_used : frth_app_used
              }
            }

            const disks = nodeDiskInfo.getDiskInfoSync();
            //total_mem = (os.totalmem()/(1024*1024*1024)).toFixed(1);
            hdd_total = hdd_used = 0;
            hdd_name = '';
            for (const disk of disks) {
               hdd_total = hdd_total + disk.blocks;
               used_drive = (disk.used/(1024*1024*1024)).toFixed(2);
               hdd_name = hdd_name.concat(disk.mounted+' '+used_drive);
            }

            hdd_total = hdd_total/(1024*1024*1024);

            var body = JSON.stringify({ "funcType": 'fetchfromCSV', "sys_key": cookies[0].name, "data": csv_array, "total_mem": total_mem, "hdd_total": hdd_total, "hdd_name": hdd_name }); 
            const request = net.request({ 
                method: 'POST', 
                url: root_url+'/utilisation.php' 
            }); 
            request.on('response', (response) => {
                //console.log(`STATUS: ${response.statusCode}`)
                response.on('data', (chunk) => {
                  //console.log(`${chunk}`);
                  if (chunk) {
                    let a;
                    try {
                      var obj = JSON.parse(chunk);
                      if(obj.status == 'valid'){
                        log.info('Successfully inserted data to database');
                      }
                      
                    } catch (e) {
                        return console.log('fetchfromCSV: No proper response received'); // error in the above string (in this case, yes)!
                    }
                   } 
                })
                response.on('end', () => {})
            })
            request.on('error', (error) => { 
                log.info('Error while fetchfromCSV '+`${(error)}`)
            })
            request.setHeader('Content-Type', 'application/json'); 
            request.write(body, 'utf-8'); 
            request.end();

          }
            
        })
      }

     }).catch((error) => {
        log.info('Session error occured in readCSVUtilisation function '+error);
     })
}

function MoveFile(){
  require_path = reqPath + '/utilise.csv';
             
  if (fs.existsSync(require_path)){
      const converter=csv()
      .fromFile(reqPath + '/utilise.csv')
      .then((json)=>{
        if(json != []){
          var datetime = new Date();
          datetime = datetime.toISOString().slice(0,10);
            
          var oldPath = reqPath + '/utilise.csv';
          require_path = reqPath + '/utilisation';

          if (!fs.existsSync(require_path)){
              fs.mkdirSync(require_path);
          } 

            var newPath = require_path + '/utilise_'+datetime+'.csv';

            mv(oldPath, newPath, err => {
                if (err) log.info('Error while moving csv file to utilisation folder '+error);
                log.info('Succesfully moved to Utilisation tab');
            }); 

        }
    })
  }

}

function addAssetUtilisation(asset_id,client_id){
  const cpu = osu.cpu;

  cpu.usage()
    .then(info => {
      free_mem = (os.freemem()/(1024*1024*1024)).toFixed(1);
      tot_mem = (os.totalmem()/(1024*1024*1024)).toFixed(1)
      utilised_RAM = tot_mem - free_mem; // in GB
      today = Math.floor(Date.now() / 1000);

      var body = JSON.stringify({ "funcType": 'assetUtilisation', "clientID": client_id, 
        "assetID": asset_id, "cpu_util": info, "ram_util": utilised_RAM }); 
      const request = net.request({ 
          method: 'POST', 
          url: root_url+'/asset.php' 
      }); 
      request.on('response', (response) => {
          //console.log(`STATUS: ${response.statusCode}`)
          response.on('data', (chunk) => {
          })
          response.on('end', () => {})
      })
      request.on('error', (error) => { 
          log.info('Error while adding asset '+`${(error)}`) 
      })
      request.setHeader('Content-Type', 'application/json'); 
      request.write(body, 'utf-8'); 
      request.end();

    }) 
}

function updateAsset(asset_id){
  global.assetID = asset_id;
  system_ip = ip.address();

  if(asset_id != null){
    si.osInfo(function(data) {
      os_release = data.kernel;
        os_bit_type = data.arch;
        os_serial = data.serial;
        os_version = data.release;
        os_name = data.distro;
        os_OEM = data.codename;

        os_data = os_name+' '+os_OEM+' '+os_bit_type+' '+os_version;

        exec('wmic path SoftwareLicensingService get OA3xOriginalProductKey', function(err, stdout, stderr) {
          if (stderr || err ) {
            // console.error(`exec error: ${stderr}`);
            // return;
            // console.log("INSIDE ERROR WMIC STATEMENT");

            var product_key='';
            
            var body = JSON.stringify({ "funcType": 'osInfo', "asset_id": asset_id, "version" : os_data,"license_key" : product_key }); 
            const request = net.request({ 
                method: 'POST', 
                url: root_url+'/asset.php' 
            }); 
            request.on('response', (response) => {
                //console.log(`STATUS: ${response.statusCode}`)
                response.on('data', (chunk) => {
                })
                response.on('end', () => {})
            })
            request.on('error', (error) => { 
                log.info('Error while updating osInfo '+`${(error)}`) 
            })
            request.setHeader('Content-Type', 'application/json'); 
            request.write(body, 'utf-8'); 
            request.end();

            return;

          }else{
         //console.log(stdout);

            // console.log("OUTSIDE ERROR WMIC STATEMENT");
            res = stdout.split('\n'); 
            var ctr=0;
            var product_key='';
            res.forEach(function(line) {
              ctr = Number(ctr)+Number(1);
              line = line.trim();
              var newStr = line.replace(/  +/g, ' ');
              var parts = line.split(/  +/g);
              if(ctr == 2){
                product_key = parts;
              }
            });

            var body = JSON.stringify({ "funcType": 'osInfo', "asset_id": asset_id, "version" : os_data,"license_key" : product_key }); 
            const request = net.request({ 
                method: 'POST', 
                url: root_url+'/asset.php' 
            }); 
            request.on('response', (response) => {
                //console.log(`STATUS: ${response.statusCode}`)
                response.on('data', (chunk) => {
                })
                response.on('end', () => {})
            })
            request.on('error', (error) => { 
                log.info('Error while updating osInfo '+`${(error)}`) 
            })
            request.setHeader('Content-Type', 'application/json'); 
            request.write(body, 'utf-8'); 
            request.end();
        }
        });

    });

    si.bios(function(data) {
       bios_name = data.vendor;
       bios_version = data.bios_version;
       bios_released = data.releaseDate;

      var body = JSON.stringify({ "funcType": 'biosInfo',  "asset_id": asset_id, "biosname": bios_name, "sys_ip": system_ip,
        "serialNo": bios_version, "biosDate": bios_released }); 
      const request = net.request({ 
          method: 'POST', 
          url: root_url+'/asset.php' 
      }); 
      request.on('response', (response) => {
          //console.log(`STATUS: ${response.statusCode}`)
          response.on('data', (chunk) => {
          })
          response.on('end', () => {})
      })
      request.on('error', (error) => { 
          log.info('Error while updating biosInfo '+`${(error)}`) 
      })
      request.setHeader('Content-Type', 'application/json'); 
      request.write(body, 'utf-8'); 
      request.end();

    });

    si.cpu(function(data) {
      processor_OEM = data.vendor;
      processor_speed_ghz = data.speed;
      processor_model = data.brand;

      var body = JSON.stringify({ "funcType": 'cpuInfo',"asset_id": asset_id,"processor" : processor_OEM, "brand": processor_model, "speed": processor_speed_ghz }); 
      const request = net.request({ 
          method: 'POST', 
          url: root_url+'/asset.php' 
      }); 
      request.on('response', (response) => {
          //console.log(`STATUS: ${response.statusCode}`)
          response.on('data', (chunk) => {
          })
          response.on('end', () => {})
      })
      request.on('error', (error) => { 
          log.info('Error while updating cpu '+`${(error)}`) 
      })
      request.setHeader('Content-Type', 'application/json'); 
      request.write(body, 'utf-8'); 
      request.end();

    });

    si.system(function(data) {
      sys_OEM = data.manufacturer;
        sys_model = data.model;
        device_name = os.hostname();
        cpuCount = os.cpus().length;
        itam_version = app.getVersion();
      serialNumber(function (err, value) {

        var body = JSON.stringify({ "funcType": 'systemInfo',"asset_id": asset_id, "make" : sys_OEM,
          "model": sys_model, "serial_num": value, "device_name": device_name, "cpu_count": cpuCount, "version": itam_version }); 
        const request = net.request({ 
            method: 'POST', 
            url: root_url+'/asset.php' 
        }); 
        request.on('response', (response) => {
            //console.log(`STATUS: ${response.statusCode}`)
            response.on('data', (chunk) => {
            })
            response.on('end', () => {})
        })
        request.on('error', (error) => { 
            log.info('Error while updating systemInfo '+`${(error)}`) 
        })
        request.setHeader('Content-Type', 'application/json'); 
        request.write(body, 'utf-8'); 
        request.end();

      });
    });

    getAntivirus(function(antivirus_data){

        var body = JSON.stringify({ "funcType": 'antivirusInfo',"asset_id": asset_id,"data" : antivirus_data }); 
        const request = net.request({ 
            method: 'POST', 
            url: root_url+'/asset.php' 
        }); 
        request.on('response', (response) => {
            //console.log(`STATUS: ${response.statusCode}`)
            response.on('data', (chunk) => {
            })
            response.on('end', () => {})
        })
        request.on('error', (error) => { 
            log.info('Error while updating antivirusInfo '+`${(error)}`) 
        })
        request.setHeader('Content-Type', 'application/json'); 
        request.write(body, 'utf-8'); 
        request.end();

    });

    exec('Get-ItemProperty -Path "HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*", "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*", "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*" | where { $_.DisplayName -ne $null } | Select-Object DisplayName, DisplayVersion | Sort DisplayName',{'shell':'powershell.exe'}, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      
      var app_list = [];
      var version ="";
      var i=0;
      res = stdout.split('\n'); 
      version = '[';
      res.forEach(function(line) {
        i=Number(i)+Number(1);
         line = line.trim();
         //var newStr = line.replace(/  +/g, ' ');
          var parts = line.split(/  +/g);
          if(parts[0] != 'DisplayName' && parts[0] != '-----------' && parts[0] != '' && parts[1] != 'DisplayVersion'){
            version += '{"name":"'+parts[0]+'","version":"'+parts[1]+'"},';
          }
      });
      version += '{}]';
      var output = JSON.stringify(version);
      output = JSON.parse(output);
      require('dns').resolve('www.google.com', function(err) {
      if (err) {
         console.log("No connection");
      } else {
        var body = JSON.stringify({ "funcType": 'softwareList', "asset_id": asset_id, "result": output }); 
        const request = net.request({ 
            method: 'POST', 
            url: root_url+'/asset.php' 
        }); 
        request.on('response', (response) => {
            //console.log(`STATUS: ${response.statusCode}`)
            response.on('data', (chunk) => {
              console.log(`${chunk}`);
            })
            response.on('end', () => {})
        })
        request.on('error', (error) => { 
            console.log(`ERROR: ${(error)}`) 
        })
        request.setHeader('Content-Type', 'application/json'); 
        request.write(body, 'utf-8'); 
        request.end();
      }
    });
  });

  } 
}

var getAntivirus = function(callback) {
  var final_list = [];

   exec('PowerShell.exe Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    var final_list = ""; 
    var antivirus_detail="";
    var ctr = 0;
    var is_name = 'no';
      res = stdout.split('\n'); 
      res.forEach(function(line) { 
          line = line.trim(); 
          if(line.length > 0){
            var newStr = line.replace(/  +/g, ' '); 
            if(newStr != '')
              var parts = newStr.split(':');
            if(parts[0].trim() == 'displayName'){
              ctr = Number(ctr)+Number(1);
              final_list ='\n'+ctr+') ';
              is_name = 'yes';
            }
            if(parts[0].trim() == 'displayName' || parts[0].trim() == 'timestamp' || parts[0].trim() == 'productState'){
                final_list += parts[0].trim()+':'+parts[1]+' <br> ';
            }
           }
           if(is_name == 'yes'){
              antivirus_detail += final_list;
              final_list ="";
           } 
      }); 
      callback(antivirus_detail);
  });

};

ipcMain.on("open_policy", (event, info) => { 
  policyWindow = new BrowserWindow({
    width: 1500,
    height: 1500,
    icon: __dirname + '/images/fav-icon.png',
    webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
       // skipTaskbar: true     
  });
  
  policyWindow.setMenuBarVisibility(false);

  policyWindow.loadURL(url.format({
    pathname: path.join(__dirname,'policy.html'),
    protocol: 'file:',
    slashes: true
  }));

  policyWindow.on('close', function (e) {
    policyWindow = null;
  });
});

ipcMain.on("download", (event, info) => { 
  var newWindow = BrowserWindow.getFocusedWindow();
  var filename = reqPath + '/output.csv';

  let options  = {
   buttons: ["OK"],
   message: "Downloaded Successfully. Find the same in Download folder"
  }

  let alert_message = dialog.showMessageBox(options);

  var output_one = [];
  var data = [];
  var space = '';

  session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
    .then((cookies1) => {
      if(cookies1.length > 0){
        if(info['tabName'] == 'usage'){

          var body = JSON.stringify({ "funcType": 'cpuDetail', "sys_key": cookies1[0].name, 
            "from_date": info['from'], "to_date": info['to']  }); 
          const request = net.request({ 
              method: 'POST', 
              url: root_url+'/download.php' 
          }); 
          request.on('response', (response) => {
              //console.log(`STATUS: ${response.statusCode}`)
              response.on('data', (chunk) => {
                //console.log(`${chunk}`);
                if (chunk) 
                {
                  let a;
                  try {
                    var obj = JSON.parse(chunk);
                    if(obj.status == 'valid'){
                      data = obj.result;
                      output_one = ['Date,Slot Time,Total Ram(GB),Total HDD(GB),HDD Name,CPU(%),RAM(%),HDD(GB),App'];
                    
                      data.forEach((d) => {
                        output_one.push(d[0]);
                          d['detail'].forEach((dd) => {
                            output_one.push(dd.join()); // by default, join() uses a ','
                          });
                        });
                    
                      fs.writeFileSync(filename, output_one.join(os.EOL));
                        var datetime = new Date();
                        datetime = datetime.toISOString().slice(0,10);
    
                        var oldPath = reqPath + '/output.csv';
                        require_path = 'C:/Users/'+ os.userInfo().username +'/Downloads';
                     
                        if (!fs.existsSync(require_path)){
                            fs.mkdirSync(require_path);
                        } 
    
                        var newPath = 'C:/Users/'+ os.userInfo().username +'/Downloads/perfomance_report_of_'+os.hostname()+'_'+datetime+'.csv';
                        mv(oldPath, newPath, err => {
                            if (err) return console.error(err);
                            console.log('success!');
                            console.log(alert_message);
                        });
                    }
                    
                  } catch (e) {
                      return console.log('cpuDetail: No proper response received'); // error in the above string (in this case, yes)!
                  }
                 } 
              })
              response.on('end', () => {})
          })
          request.on('error', (error) => { 
              console.log(`ERROR: ${(error)}`) 
          })
          request.setHeader('Content-Type', 'application/json'); 
          request.write(body, 'utf-8'); 
          request.end();

        }else if(info['tabName'] == 'app'){ 
           filename = reqPath + '/app_output.csv';
           var body = JSON.stringify({ "funcType": 'appDetail', "sys_key": cookies1[0].name, "from_date": info['from'], "to_date": info['to']  }); 
            const request = net.request({ 
                method: 'POST', 
                url: root_url+'/download.php' 
            }); 
            request.on('response', (response) => {
                //console.log(`STATUS: ${response.statusCode}`)
                response.on('data', (chunk) => {
                  //console.log(`${chunk}`);
                  if (chunk) {
                    let a;
                    try {
                      var obj = JSON.parse(chunk);
                      if(obj.status == 'valid'){
                        data = obj.result;
                        output_one = ['Date,Detail']; 
                        data.forEach((d) => {
                            output_one.push(d.join()); // by default, join() uses a ','
                          });
                      
                        fs.writeFileSync(filename, output_one.join(os.EOL));
                          var datetime = new Date();
                          datetime = datetime.toISOString().slice(0,10);

                          var oldPath = reqPath + '/app_output.csv';
                          require_path = 'C:/Users/'+ os.userInfo().username +'/Downloads';
                      
                        if (!fs.existsSync(require_path)){
                            fs.mkdirSync(require_path);
                        } 

                          var newPath = 'C:/Users/'+ os.userInfo().username +'/Downloads/app_used_report_of_'+os.hostname()+'_'+datetime+'.csv';
                          mv(oldPath, newPath, err => {
                              if (err) return console.error(err);
                              console.log('success!');
                              console.log(alert_message);
                          });
                      }
                      
                    } catch (e) {
                        return console.log('appDetail: No proper response received'); // error in the above string (in this case, yes)!
                    }
                   } 
                })
                response.on('end', () => {})
            })
            request.on('error', (error) => { 
                console.log(`ERROR: ${(error)}`) 
            })
            request.setHeader('Content-Type', 'application/json'); 
            request.write(body, 'utf-8'); 
            request.end();
        }
      }
    }).catch((error) => {
      console.log(error)
    })

});

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

ipcMain.on('openTabs',function(e,form_data){  
  tabWindow = new BrowserWindow({
    width: 1500,
    height: 1500,
    icon: __dirname + '/images/fav-icon.png',
    webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
      //  skipTaskbar: true  
  });
 
  tabWindow.setMenuBarVisibility(false);

  tabWindow.loadURL(url.format({
    pathname: path.join(__dirname,'setting/all_in_one.html'),
    protocol: 'file:',
    slashes: true
  }));

  tabWindow.on('close', function (e) {
    // if (electron.app.isQuitting) {
    //  return
    // }
    // e.preventDefault();
    tabWindow = null;
  });
});


ipcMain.on('tabData',function(e,form_data){ 
  session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
    .then((cookies1) => {
      if(cookies1.length > 0){
        if(form_data['tabName'] == 'ticket'){

          var body = JSON.stringify({ "funcType": 'ticketDetail', "sys_key": cookies1[0].name, "clientid": form_data['clientid'] }); 
          const request = net.request({ 
              method: 'POST', 
              url: root_url+'/ticket.php' 
          }); 
          request.on('response', (response) => {
              //console.log(`STATUS: ${response.statusCode}`)
              response.on('data', (chunk) => {
                //console.log(`${chunk}`);
                if (chunk) {
                  let a;
                  try {
                    var obj = JSON.parse(chunk);
                    if(obj.status == 'valid'){
                      e.reply('tabTicketReturn', obj.result) ;
                    }else if(obj.status == 'invalid'){
                      e.reply('tabTicketReturn', obj.result) ;
                    }
                    
                  } catch (e) {
                      return console.log('ticketDetail: No proper response received'); // error in the above string (in this case, yes)!
                  }
                 } 
              })
              response.on('end', () => {})
          })
          request.on('error', (error) => { 
              log.info('Error while fetching ticket detail'+`${(error)}`)
          })
          request.setHeader('Content-Type', 'application/json'); 
          request.write(body, 'utf-8'); 
          request.end();

        }else if(form_data['tabName'] == 'task')
        {
            var body = JSON.stringify({ "funcType": 'TaskManagerTable', "sys_key": cookies1[0].name}); 
            const request = net.request({ 
                method: 'POST', 
                url: root_url+'/task_manager.php' 
            });
            request.on('response', (response) => {
              // console.log(`STATUS: ${response.statusCode}`)
              response.on('data',(chunk) => {
                // console.log(chunk);
                // console.log(`${chunk}`);
                // console.log(chunk.toString('utf8'));
               if (chunk) {
                let a;
                try {
                  var obj = JSON.parse(chunk);
                  if(obj.status == 'valid'){
                    // console.log(obj);
                     e.reply('tabTaskReturn',obj.result);
                   }
                   else if(obj.status == 'invalid'){
                    e.reply('tabTaskReturn', obj.result) ;
                  }
                  
                } catch (e) {
                    return console.log('TaskManagerTable: No proper response received'); // error in the above string (in this case, yes)!
                }
               } 
              })
              response.on('end', () => {})
          })
              request.on('error', (error) => { 
              log.info('Error while fetching task detail'+`${(error)}`)
          })
          request.setHeader('Content-Type', 'application/json'); 
          request.write(body, 'utf-8'); 
          request.end();
        }else if(form_data['tabName'] == 'asset'){

          var body = JSON.stringify({ "funcType": 'assetDetail', "clientID": form_data['clientid'] }); 
          const request = net.request({ 
              method: 'POST', 
              url: root_url+'/asset.php' 
          }); 
          request.on('response', (response) => {
              //console.log(`STATUS: ${response.statusCode}`)
              response.on('data', (chunk) => {
                //console.log(`${chunk}`);
                if (chunk) {
                  let a;
                  try {
                    var obj = JSON.parse(chunk);
                    if(obj.status == 'valid'){
                      e.reply('tabAssetReturn', obj.result[0]) ;
                    }
                    
                  } catch (e) {
                      return console.log('assetDetail: No proper response received'); // error in the above string (in this case, yes)!
                  }
                 } 
              })
              response.on('end', () => {})
          })
          request.on('error', (error) => { 
              log.info('Error while fetching asset detail '+`${(error)}`)
          })
          request.setHeader('Content-Type', 'application/json'); 
          request.write(body, 'utf-8'); 
          request.end();
          
        }else if(form_data['tabName'] == 'user'){

          var body = JSON.stringify({ "funcType": 'userDetail', "clientID": form_data['clientid'] }); 
          const request = net.request({ 
              method: 'POST', 
              url: root_url+'/user.php' 
          }); 
          request.on('response', (response) => {
              //console.log(`STATUS: ${response.statusCode}`)
              response.on('data', (chunk) => {
                //console.log(`${chunk}`);
                 if (chunk) {
                  let a;
                  try {
                    var obj = JSON.parse(chunk);
                    if(obj.status == 'valid'){
                      if(obj.result[0][2] == ''){
                         obj.result[0][2] = 'Not Available';
                       }
   
                       if(obj.result[0][3] == ''){
                         obj.result[0][3] = 'Not Available';
                       }
   
                     e.reply('tabUserReturn', obj.result[0]);
                    }
                    
                  } catch (e) {
                      return console.log('userDetail: No proper response received'); // error in the above string (in this case, yes)!
                  }
                 } 
              })
              response.on('end', () => {})
          })
          request.on('error', (error) => { 
              log.info('Error while fetching user detail '+`${(error)}`)
          })
          request.setHeader('Content-Type', 'application/json'); 
          request.write(body, 'utf-8'); 
          request.end();
          
        }else if(form_data['tabName'] == 'usage'){
           e.reply('tabUtilsReturn', '') ;
        }else if(form_data['tabName'] == 'app'){ 
           session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
             .then((cookies1) => {
              if(cookies1.length > 0){
                request({
                uri: root_url+"/utilisation.php",
                method: "POST",
                form: {
                  funcType: 'appDetail',
                  sys_key: cookies1[0].name,
                  from_date: form_data['from'],
                  to_date: form_data['to']
                }
              }, function(error, response, body) { 
                if(error){
                  log.info('Error while fetching app detail '+error);
                }else{
                  if(body != '' || body != null){ 
                    output = JSON.parse(body); 
                    if(output.status == 'valid'){ 
                      e.reply('tabAppReturn', output.result) ;
                    }else if(output.status == 'invalid'){
                      e.reply('tabAppReturn', output.result) ;
                    }
                  }
                }
              });
              }
          }).catch((error) => {
            console.log(error)
          })
        
        }else if(form_data['tabName'] == 'quick_util'){ 
          var result = [];
          const cpu = osu.cpu;
          const disks = nodeDiskInfo.getDiskInfoSync();

          total_ram = (os.totalmem()/(1024*1024*1024)).toFixed(1);
          free_ram = (os.freemem()/(1024*1024*1024)).toFixed(1);
          utilised_RAM = (total_ram - free_ram).toFixed(1);
          
          result['total_ram'] = total_ram;
          result['used_ram'] = utilised_RAM;

          hdd_total = hdd_used = 0;
          hdd_name = '';

          for (const disk of disks) {
               if(disk.filesystem == 'Local Fixed Disk'){
                 hdd_total = hdd_total + disk.blocks;
                 hdd_used = hdd_used + disk.used;
                 used_drive = (disk.used/(1024*1024*1024)).toFixed(2); 
                 hdd_name = hdd_name.concat(disk.mounted+' '+used_drive+' GB <br>');
             }
                
          }

          hdd_total = (hdd_total/(1024*1024*1024)).toFixed(1);
          hdd_used = (hdd_used/(1024*1024*1024)).toFixed(1);

          result['hdd_total'] = hdd_total;
          result['hdd_used'] = hdd_used;
          result['hdd_name'] = hdd_name;

          
          cpu.usage()
            .then(info => { 

              if(info == 0){
                info = 1;
              }

              result['cpu_usage'] = info;
              e.reply('setInstantUtil',result);
          })
        }
      }
  }).catch((error) => {
      console.log(error)
    })
});

ipcMain.on('form_data',function(e,form_data){  
  type = form_data['type']; 
  category = form_data['category'];
  
  loginid = form_data['user_id'];

  calendar_id = 0; //value has to be given
  client_id = form_data['clientid']; //value has to be given
  user_id = form_data['user_id']; //value has to be given
  //engineer_id = "";
  partner_id = 0;
  status_id = 4;
  external_status_id = 6;
  internal_status_id = 5
  issue_type_id ="";
  //is_media = null;
  catgory = 0;
  asset_id = form_data['assetID']; //value has to be given
  //address_id = null;
  description = form_data['desc'];
  ticket_no = Math.floor(Math.random() * (9999 - 10 + 1) + 10);
  resolution_method_id = 1;
  


  if(form_data['disp_type'] == 'PC' ){
    if(type == '1'){
      issue_type_id ="1,13,"+category;
    }else if(type == '2'){
      issue_type_id ="2,15,"+category;
    }else if(type == '3'){
      issue_type_id ="556,557,"+category;
    }
  }
  else if(form_data['disp_type'] == 'WiFi'){
    issue_type_id ="1,13,47,179,"+category;
  }
  else if(form_data['disp_type'] == 'Network'){
    issue_type_id ="1,13,47,"+category;
  }
  else if(form_data['disp_type'] == 'Antivirus'){
    issue_type_id ="1,13,56,156,265,"+category;
  }
  else if(form_data['disp_type'] == 'Application'){
    issue_type_id ="1,13,56,156,"+category;
  }
  else if(form_data['disp_type'] == 'Printers'){
    issue_type_id ="6,22,42,"+category;
  }

  estimated_cost = 0;
  //request_id = null;
  is_offer_ticket = 2;
  is_reminder = 0;
  is_completed = 3;
  res_cmnt_confirm  = 0;
  res_time_confirm  = 0;
  is_accept = 0;
  resolver_wi_step = 0;
  is_partner_ticket = 2;
  created_by = user_id;
  created_on = Math.floor(Date.now() / 1000); 
  updated_by = user_id;
  updated_on = Math.floor(Date.now() / 1000);

  var body = JSON.stringify({ "funcType": 'ticketInsert', "tic_type": form_data['type'], "loginID": loginid, "calender": calendar_id,
    "clientID": client_id, "userID": user_id, "partnerID": partner_id, "statusID": status_id, "exstatusID": external_status_id, "instatusID": internal_status_id,
    "catgory": catgory, "asset_id": asset_id, "desc": description, "tic_no": ticket_no, "resolution": resolution_method_id, "issue_type": issue_type_id, "est_cost": estimated_cost,
    "offer_tic": is_offer_ticket, "reminder": is_reminder, "complete": is_completed, "cmnt_confirm": res_cmnt_confirm, "time_confirm": res_time_confirm,
    "accept": is_accept, "wi_step": resolver_wi_step, "partner_tic": is_partner_ticket }); 
  
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/ticket.php' 
  }); 
  request.on('response', (response) => {
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        //console.log(`${chunk}`);
       if (chunk) {
                let a;
                try {
                  var obj = JSON.parse(chunk);
                  var result = [];
                  if(obj.status == 'valid'){
                    global.ticketNo = obj.ticket_no;
                    result['status'] = 1;
                    result['ticketNo'] = ticketNo;
                    e.reply('ticket_submit',result);
                  }else{
                    result['status'] = 0;
                    result['ticketNo'] = '';
                    e.reply('ticket_submit',result);
                    
                  }
                  
                } catch (e) {
                    return console.log('ticketInsert: No proper response received'); // error in the above string (in this case, yes)!
                }
               } 

      })
      response.on('end', () => {})
  })
  request.on('error', (error) => { 
      log.info('Error while inserting ticket '+`${(error)}`)
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

});

ipcMain.on('getUsername',function(e,form_data){ 

  var body = JSON.stringify({ "funcType": 'getusername', "clientID": form_data['clientid'] }); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/user.php' 
  }); 
  request.on('response', (response) => {
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => { 
        //console.log(`${chunk}`);
       if (chunk) {
          let a;
          try {
            var obj = JSON.parse(chunk);
            if(obj.status == 'valid'){
              e.reply('returnUsername', obj.result) ;
            }
            
          } catch (e) {
              return console.log('getusername: No proper response received'); // error in the above string (in this case, yes)!
          }
         } 
      })
      response.on('end', () => {})
  })
  request.on('error', (error) => { 
      log.info('Error while fetching user name '+`${(error)}`)
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

});

function getIssueTypeData(type,callback){
  
  $query = 'SELECT `estimate_time`,`device_type_id`,`impact_id` FROM `et_issue_type_master` where `it_master_id`="'+type+'"';
  connection.query($query, function(error, results, fields) {
      if (error) {
        return connection.rollback(function() {
          throw error;
        });
      }else{
        callback(null,results);
      }
      
  });
}

function getMaxId($query,callback){
  connection.query($query, function(error, results, fields) {
      if (error) {
        return connection.rollback(function() {
          throw error;
        });
      }else{
        callback(null,results);
      }
      
  });
}

ipcMain.on('openHome',function(e,data){
  display = electron.screen.getPrimaryDisplay();
    width = display.bounds.width;
  mainWindow = new BrowserWindow({
    width: 392,
    height: 520,
    icon: __dirname + '/images/fav-icon.png',
    frame: false,
    x: width - 450,
    y: 190,
    webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
    },
    //skipTaskbar: true  
  });
 // mainWindow.hide();
  mainWindow.setMenuBarVisibility(false);
 
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname,'index.html'),
    protocol: 'file:',
    slashes: true
  }));
  //mainWindow.setMenu(null);

  //categoryWindow.close();
  categoryWindow.on('close', function (e) {
    categoryWindow = null;
  });
});

ipcMain.on('internet_reconnect',function(e,data){ 
  
  session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
    .then((cookies) => {
      if(cookies.length > 0){
        SetCron(cookies[0].name);
      }
    }).catch((error) => {
      console.log(error)
    })
    setGlobalVariable();
});

ipcMain.on('getSystemKey',function(e,data){
console.log('getSystemKey Main');
  var body = JSON.stringify({ "funcType": 'getSysKey' }); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/login.php'    
  }); 
  request.on('response', (response) => {
      console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
       
        if (chunk) {
          let a;
          try {
            var obj = JSON.parse(chunk);
            console.log(obj.sys_key);
            if(obj.sys_key != '' || obj.sys_key != null){
              e.reply('setSysKey', obj.sys_key);
            }
            
          } catch (e) {
              return console.log('getSysKey: No proper response received'); // error in the above string (in this case, yes)!
          }
         } 
      })
      response.on('end', () => {})
  })
  request.on('error', (error) => { 
      log.info('Error while fetching system key '+`${(error)}`)
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

});

ipcMain.on('loadAllocUser',function(e,data){ 
  console.log(data.userID);
  console.log('Inside loadAllocUser');
  var body = JSON.stringify({ "funcType": 'getAllocUser', "userID": data.userID }); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/login.php' 
  }); 
  request.on('response', (response) => {
   // console.log(response);
      console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        if (chunk) {
          let a;
          try {
            var obj = JSON.parse(chunk);
            console.log(obj);
            if(obj.status == 'valid'){
              e.reply('setAllocUser', obj.result);
            }else{
              e.reply('setAllocUser', '');
            }
            
          } catch (e) {
              return console.log('getAllocUser: No proper response received'); // error in the above string (in this case, yes)!
          }
         } 
      })
      response.on('end', () => {})
  })
  request.on('error', (error) => { 
      log.info('Error while getting allocated user detail '+`${(error)}`)
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

});

ipcMain.on('login_data',function(e,data){ 
  console.log(data);
  var system_ip = ip.address();
  var asset_id = "";
  var machineId = uuid.machineIdSync({original: true});
  hdd_total = 0;
  
    RAM = (os.totalmem()/(1024*1024*1024)).toFixed(1);
    const disks = nodeDiskInfo.getDiskInfoSync();

    for (const disk of disks) {
        if(disk.filesystem == 'Local Fixed Disk'){
           hdd_total = hdd_total + disk.blocks;
        }
    }
    hdd_total = hdd_total/(1024*1024*1024);

    serialNumber(function (err, value) {
      // console.log(sys_OEM);console.log(sys_model);console.log(value);console.log(data.system_key); console.log(getmac.default());
       mac_address = getmac.default();
       console.log(mac_address);
       si.system()
       .then(systemInfo => {
         const deviceId = systemInfo.uuid;
         
       console.log('Device ID:', deviceId);
       var body = JSON.stringify({ "funcType": 'loginFunc', "userID": data.userId,
         "sys_key": data.system_key, "dev_type": data.device_type, "ram" : RAM, "hdd_capacity" : hdd_total,
         "machineID" : machineId, "title": data.title, "user_fname": data.usr_first_name, "user_lname": data.usr_last_name,
         "user_email": data.usr_email,"user_mob_no": data.usr_contact,"token": data.token,"client_no": data.clientno,"ip": system_ip,"make":sys_OEM, "model": sys_model, "serial_num": value, "mac_address": mac_address, "deviceId": deviceId }); 
       const request = net.request({ 
           method: 'POST', 
           url: root_url+'/login.php' 
       }); 
    request.on('response', (response) => {
        //console.log(`STATUS: ${response.statusCode}`)
        response.on('data', (chunk) => {
          console.log(`${chunk}`);
          if (chunk) {
            let a;
            try {
              var obj = JSON.parse(chunk);
              console.log(obj);
              // console.log('Hiiiiiiiiiiiiiiiiiiiiiiii');
              // console.log(obj.result);
              // console.log(obj.loginPass[0]);
              if(obj.status == 'valid'){
                const cookie = {url: 'http://www.eprompto.com', name: data.system_key, value: data.system_key, expirationDate:9999999999 }
                session.defaultSession.cookies.set(cookie, (error) => {
                  if (error) console.error(error)
                })

                fs.writeFile(detail, data.system_key, function (err) {
                  if (err) return console.log(err);
                });

                global.clientID = obj.result;
                global.userName = obj.loginPass[0];
                global.loginid = obj.loginPass[1];
                asset_id = obj.asset_maxid;
                //updateAsset(asset_id);
                softwareDetails();
                hardwareDetails();
                keyboardDetails();
                mouseDetails();
                graphicCardDetails();
                motherboardDetails();
                monitorDetails();
                monitorInchesScreen();
                //addAssetUtilisation(output.asset_maxid,output.result[0]);
                global.deviceID = data.device_type;
      
                mainWindow = new BrowserWindow({
                  width: 392,
                  height: 520,
                  icon: __dirname + '/images/fav-icon.png',
                  frame: false,
                  x: width - 450,
                    y: 190,
                  webPreferences: {
                        nodeIntegration: true,
                        enableRemoteModule: true,
                    },
                  // skipTaskbar: true  
                });
              // mainWindow.hide();
                mainWindow.setMenuBarVisibility(false);
              
              
                
                mainWindow.loadURL(url.format({
                  pathname: path.join(__dirname,'index.html'),
                  protocol: 'file:',
                  slashes: true
                }));

                // child = new BrowserWindow({ 
                //   parent: mainWindow,
                //   icon: __dirname + '/images/fav-icon.png', 
                //   modal: true, 
                //   show: true,
                //   width: 370,
                //   height: 100,
                //   frame: false,
                //   x: width - 450,
                //       y: 190,
                //   webPreferences: {
                //           nodeIntegration: true,
                //           enableRemoteModule: true,
                //       }
                // });

                // child.setMenuBarVisibility(false);

                // child.loadURL(url.format({
                //   pathname: path.join(__dirname,'modal.html'),
                //   protocol: 'file:',
                //   slashes: true
                // }));
                child.once('ready-to-show', () => {
                  child.show()
                });

                  
                startWindow.close();
                // loginWindow.on('close', function (e) {
                //   loginWindow = null;
                // });

                tray.on('click', function(e){
                    if (mainWindow.isVisible()) {
                      mainWindow.hide();
                      
                    } else {
                      mainWindow.hide();
                    
                    }
                });
                
                mainWindow.on('close', function (e) {
                if (process.platform !== "darwin") {
                  app.quit();
                }
                // // if (electron.app.isQuitting) {
                // //  return
                // // }
                // e.preventDefault()
                // mainWindow.hide()
                // // if (child.isVisible()) {
                // //     child.hide()
                // //   } 
                // //mainWindow = null;
              });
              }
              
            } catch (e) {
                return console.log('loginFunc: No proper response received'); // error in the above string (in this case, yes)!
            }
           } 
        })
        response.on('end', () => {})
    })
    request.on('error', (error) => { 
      log.info('Error in login function '+`${(error)}`);
    })
    request.setHeader('Content-Type', 'application/json'); 
    request.write(body, 'utf-8'); 
    request.end();
  });
  })
});


ipcMain.on('create_new_member',function(e,form_data){  
  regWindow = new BrowserWindow({
    width: 392,
    height: 520,
    icon: __dirname + '/images/fav-icon.png',
    //frame: false,
    x: width - 450,
        y: 190,
    webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
      //  skipTaskbar: true  
  });

  regWindow.setMenuBarVisibility(false);
 
  regWindow.loadURL(url.format({
    pathname: path.join(__dirname,'new_member.html'),
    protocol: 'file:',
    slashes: true
  }));

  startWindow.close();
  // startWindow.on('close', function (e) {
  //   startWindow = null;
  // });

});

ipcMain.on('cancel_reg',function(e,form_data){  
  startWindow = new BrowserWindow({
    width: 392,
    height: 520,
    icon: __dirname + '/images/fav-icon.png',
    //frame: false,
    x: width - 450,
        y: 190,
    webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
       // skipTaskbar: true  
  });
  
  startWindow.setMenuBarVisibility(false);

  startWindow.loadURL(url.format({
    pathname: path.join(__dirname,'login.html'),
    protocol: 'file:',
    slashes: true
  }));

  regWindow.close();
  // regWindow.on('close', function (e) {
  //   regWindow = null;
  // });
});

ipcMain.on('update_member',function(e,form_data){  
  loginWindow = new BrowserWindow({
    width: 392,
    height: 520,
    icon: __dirname + '/images/fav-icon.png',
    //frame: false,
    x: width - 450,
        y: 190,
    webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
       // skipTaskbar: true  
  });
  
  loginWindow.setMenuBarVisibility(false);

  // loginWindow.loadURL(url.format({
  //   pathname: path.join(__dirname,'login.html'),
  //   protocol: 'file:',
  //   slashes: true
  // }));

  startWindow.close();
  // startWindow.on('close', function (e) {
  //   startWindow = null;
  // });
});

ipcMain.on('cancel_login',function(e,form_data){  
  startWindow = new BrowserWindow({
    width: 392,
    height: 520,
    icon: __dirname + '/images/fav-icon.png',
    //frame: false,
    x: width - 450,
        y: 190,
    webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
       // skipTaskbar: true  
  });
 
  startWindow.setMenuBarVisibility(false);

  startWindow.loadURL(url.format({
    pathname: path.join(__dirname,'login.html'),
    protocol: 'file:',
    slashes: true
  }));

  loginWindow.close();
  // loginWindow.on('close', function (e) {
  //   //loginWindow = null;
  //   if(process.platform != 'darwin')
 //        app.quit();
  // });
});

ipcMain.on('check_email',function(e,form_data){ 
  
  var body = JSON.stringify({ "funcType": 'checkemail', "email": form_data['email'] }); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/login.php' 
  }); 
  request.on('response', (response) => {
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
         if (chunk) {
          let a;
          try {
            var obj = JSON.parse(chunk);
            if(obj.status == 'valid'){
              e.reply('checked_email', obj.status);
            }else if(obj.status == 'invalid'){
              e.reply('checked_email', obj.status);
            }
          
          } catch (e) {
              return console.log('checkemail: No proper response received'); // error in the above string (in this case, yes)!
          }
         } 
      })
      response.on('end', () => {})
  })
  request.on('error', (error) => { 
    log.info('Error n login function '+`${(error)}`)
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

});

ipcMain.on('check_user_email',function(e,form_data){ 
  
  var body = JSON.stringify({ "funcType": 'check_user_email', "email": form_data['email'], "parent_id": form_data['parent_id'] }); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/login.php' 
  }); 
  request.on('response', (response) => {
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        if (chunk) {
          let a;
          try {
            var obj = JSON.parse(chunk);
            if(obj.status == 'valid'){
              e.reply('checked_user_email', obj.status);
            }else if(obj.status == 'invalid'){
              e.reply('checked_user_email', obj.status);
            }
            
          } catch (e) {
              return console.log('check_user_email: No proper response received'); // error in the above string (in this case, yes)!
          }
         } 
      })
      response.on('end', () => {})
  })
  request.on('error', (error) => { 
    log.info('Error n login function '+`${(error)}`)
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();
    
});

ipcMain.on('check_member_email',function(e,form_data){ 

  var body = JSON.stringify({ "funcType": 'checkmemberemail', "email": form_data['email'] }); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/login.php'   
  }); 
  request.on('response', (response) => {
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        if (chunk) {
          let a;
          try {
            var obj = JSON.parse(chunk);
            console.log(obj.sql);
            if(obj.status == 'valid'){
              e.reply('checked_member_email', obj);
            }else if(obj.status == 'invalid'){
              e.reply('checked_member_email', obj);
            }
            
          } catch (e) {
              return console.log('checkmemberemail: No proper response received'); // error in the above string (in this case, yes)!
          }
         } 
      })
      response.on('end', () => {})
  })
  request.on('error', (error) => { 
    log.info('Error while checking member email '+`${(error)}`)
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();
  
});

ipcMain.on('member_registration',function(e,form_data){ 
  var system_ip = ip.address();
  RAM = (os.totalmem()/(1024*1024*1024)).toFixed(1);
  const disks = nodeDiskInfo.getDiskInfoSync();
  hdd_total = 0;
  
  for (const disk of disks) {
      if(disk.filesystem == 'Local Fixed Disk'){
         hdd_total = hdd_total + disk.blocks;
      }
  }
  hdd_total = hdd_total/(1024*1024*1024);

  var body = JSON.stringify({ "funcType": 'member_register', "title": form_data['title'], "first_name": form_data['mem_first_name'], "last_name": form_data['mem_last_name'],
    "email": form_data['mem_email'], "contact": form_data['mem_contact'], "company": form_data['mem_company'], "dev_type": form_data['device_type'], "ip": system_ip,
    "ram": RAM, "hdd_capacity" : hdd_total, "otp": form_data['otp']}); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/login.php'   
  }); 
  request.on('response', (response) => {
     console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        if (chunk) {
          let a;
          try {
            var obj = JSON.parse(chunk);
            console.log(obj);
            if(obj.status == 'valid'){ 
              global.clientID = obj.result;
              global.userName = obj.loginPass[0];
                global.loginid = obj.loginPass[1];
                asset_id = obj.asset_maxid;
                global.NetworkStatus = 'Yes';
                global.assetID = asset_id;
                global.sysKey = obj.sysKey;
               // updateAsset(asset_id);
                softwareDetails();
                hardwareDetails();
                keyboardDetails();
                mouseDetails();
                graphicCardDetails();
                motherboardDetails();
                monitorDetails();
                monitorInchesScreen();
                //addAssetUtilisation(output.asset_maxid,output.result[0]);
                const cookie = {url: 'http://www.eprompto.com', name: obj.sysKey , value: obj.sysKey, expirationDate:9999999999 }
              session.defaultSession.cookies.set(cookie, (error) => {
                if (error) console.error(error)
              })

              fs.writeFile(detail, obj.sysKey, function (err) {
                if (err) return console.log(err);
              });

              global.deviceID = form_data['device_type'];

              mainWindow = new BrowserWindow({
                width: 392,
                height:520,
                icon: __dirname + '/images/fav-icon.png',
                frame: false,
                x: width - 450,
                  y: 190,
                webPreferences: {
                      nodeIntegration: true,
                      enableRemoteModule: true,
                  },
                // skipTaskbar: true  
              });
              
              mainWindow.setMenuBarVisibility(false);
          //  mainWindow.hide();
              mainWindow.loadURL(url.format({
                pathname: path.join(__dirname,'index.html'),
                protocol: 'file:',
                slashes: true
              }));

              child = new BrowserWindow({ 
                parent: mainWindow,
                icon: __dirname + '/images/fav-icon.png', 
                modal: true, 
                show: true,
                width: 380,
                height: 100,
                frame: false,
                x: width - 450,
                    y: 190,
                webPreferences: {
                        nodeIntegration: true,
                        enableRemoteModule: true,
                    },
                  // skipTaskbar: true  
              });
              
              child.setMenuBarVisibility(false);
              
              child.loadURL(url.format({
                pathname: path.join(__dirname,'modal.html'),
                protocol: 'file:',
                slashes: true
              }));
              child.once('ready-to-show', () => {
                child.show()
              });
                  
              regWindow.close();
            
              tray.on('click', function(e){
                  if (mainWindow.isVisible()) {
                    mainWindow.hide()
                  } else {
                    mainWindow.hide()
                  }
              });
            
              mainWindow.on('close', function (e) {
                if (process.platform !== "darwin") {
                  app.quit();
                }
              });
            }else if(obj.status == 'wrong_otp'){
              e.reply('otp_message', 'OTP entered is wrong');
            }
            
          } catch (e) {
              return console.log('member_register: No proper response received'); // error in the above string (in this case, yes)!
          }
         } 
      })
      response.on('end', () => {})
  })
  request.on('error', (error) => { 
    log.info('Error n member registration function '+`${(error)}`);
    require('dns').resolve('www.google.com', function(err) {
      if (err) {
        e.reply('error_message', 'No internet connection');
      } else {
        e.reply('error_message', 'Request not completed');
      }
      global.NetworkStatus = 'No';
    });
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

  

});

ipcMain.on('check_forgot_email',function(e,form_data){ 

  request({
    uri: root_url+"/login.php",
    method: "POST",
    form: {
      funcType: 'check_forgot_cred_email',
      email: form_data['email']
    }
  }, function(error, response, body) { 
    output = JSON.parse(body); 
    e.reply('checked_forgot_email', output.status);
  });
});

ipcMain.on('sendOTP',function(e,form_data){ 
  
  var body = JSON.stringify({ "funcType": 'sendOTP', "email": form_data['emailID'], "mem_name": form_data['name'] }); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/login.php' 
  }); 
  request.on('response', (response) => {
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        //console.log(`${chunk}`);
        if (chunk) {
          let a;
          try {
            var obj = JSON.parse(chunk);
            e.reply('sendOTP_status', obj.status);
           
          } catch (e) {
              return console.log('sendOTP: No proper response received'); // error in the above string (in this case, yes)!
          }
         } 
      })
      response.on('end', () => {})
  })
  request.on('error', (error) => { 
      log.info('Error while sending OTP '+`${(error)}`) 
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

});


ipcMain.on('forgot_cred_email_submit',function(e,form_data){ 
//not used
  request({
    uri: root_url+"/check_clientno.php",
    method: "POST",
    form: {
      funcType: 'forgot_cred_email',
      email: form_data['email']
    }
  }, function(error, response, body) { 
    output = JSON.parse(body); 
    e.reply('forgot_cred_email_submit_response', output.status);
    //forgotWindow.close();
    
  });

});

ipcMain.on('ticketform',function(e,form_data){ 
  ticketWindow = new BrowserWindow({
    width: 392,
    height: 520,
    icon: __dirname + '/images/fav-icon.png',
    x: width - 450,
    y: 190,
    webPreferences: {
            nodeIntegration: true
        }
  });
  
  ticketWindow.setMenuBarVisibility(false);

  ticketWindow.loadURL(url.format({
    pathname: path.join(__dirname,'category/pc_laptop.html'),
    protocol: 'file:',
    slashes: true
  }));

  ticketWindow.webContents.on('did-finish-load', ()=>{
    ticketWindow.webContents.send('device_type_ticket', form_data['issueType']);
  });

  mainWindow.close();
  // mainWindow.on('close', function (e) {
  //   mainWindow = null;
  // });

});

ipcMain.on('back_to_main',function(e,form_data){ 

  mainWindow = new BrowserWindow({
    width: 392,
    height: 520,
    icon: __dirname + '/images/fav-icon.png',
    x: width - 450,
    y: 190,
    webPreferences: {
            nodeIntegration: true
        },
    //skipTaskbar: true
  });
  
  mainWindow.setMenuBarVisibility(false);
  //mainWindow.hide();
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname,'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  ticketWindow.close();
  // ticketWindow.on('close', function (e) {
  //   //ticketWindow = null;
  //   if(process.platform != 'darwin')
 //        app.quit();
  // });

});

ipcMain.on('thank_back_to_main',function(e,form_data){ 

  mainWindow = new BrowserWindow({
    width: 392,
    height: 520,
    icon: __dirname + '/images/fav-icon.png',
    x: width - 450,
    y: 190,
    webPreferences: {
            nodeIntegration: true
        },
     //skipTaskbar: true
  });
  
  mainWindow.setMenuBarVisibility(false);
 // mainWindow.hide();
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname,'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  categoryWindow.close();
  // categoryWindow.on('close', function (e) {
  //   categoryWindow = null;
  // });

});

ipcMain.on('update_is_itam_policy',function(e,form_data){ 

  var body = JSON.stringify({ "funcType": 'update_itam_policy', "clientId": form_data['clientID'] }); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/main.php' 
  }); 
  request.on('response', (response) => {
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        //console.log(`${chunk}`);
        
        if (chunk) {
          let a;
          try {
            var obj = JSON.parse(chunk);
            if(obj.status == 'invalid'){
              log.info('Error occured on updating itam policy');
            }
          } catch (e) {
              return console.log('update_itam_policy: No proper response received'); // error in the above string (in this case, yes)!
          }
         } 
      })
      response.on('end', () => {})
  })
  request.on('error', (error) => { 
    log.info('Error occured on updating client master '+`${(error)}`);
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

});

app.on('window-all-closed', function () {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});
//autoUpdater.on('update-downloaded', () => {
  //updateDownloaded = true;
  //mainWindow.webContents.send('update_downloaded');
//});

// ipcMain.on('restart_app', () => {
//   autoUpdater.quitAndInstall();
// });

autoUpdater.on('update-downloaded', () => {
  // notifier.notify(
  //   {
  //     title: 'Update Available.', //put version number of future release. not current.
  //     message: 'It will be Updated on Application Restart.',
  //     icon: path.join(app.getAppPath(), '/images/fav-icon.png'),
  //     sound: true,
  //     wait: true, 
  //     appID: "Click to restart Application"
  //   },
  //   function (err, response, metadata) {
  //     // console.log(response);
  //     // console.log(err);
  //     if(response == undefined){
  //       console.log("auto updater quit and install function called.")
        autoUpdater.quitAndInstall();
    //   }
  
    //  }
   //);

  // console.log(app.getVersion()); // temp
  // title:'ITAM Version'+AppVersionNumber+'Released. Click to Restart Application.'

});




// ------------------------------ Preventive Maintenance Starts here : ------------------------------------------------------------


ipcMain.on('Preventive_Maintenance_Main',function(e,form_data,pm_type) {
  console.log("Preventive Maintenance Type: "+pm_type);

  console.log('inside Preventive_Maintenance_Main function');
  
    require('dns').resolve('www.google.com', function(err) {
      if (err) {
          console.log("No connection");

          var filepath = "C:/ITAMEssential/lock_call.txt";
          fs.readFile(filepath, 'utf-8', (err, data) => {
            if(err){
               console.log("An error ocurred reading the file :" + err.message);
                return;
            }

            // Change how to handle the file content
            console.log("The file content is : " + data);
            
            var lock_string =  data[16]+data[17]+data[18];
            console.log(lock_string);
            if(lock_string == 'yes')
            {
              exec("Rundll32.exe user32.dll,LockWorkStation", (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
            });
            }
           
        });

      } else {
        session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
        .then((cookies) => {
        if(cookies.length > 0){
          var body = JSON.stringify({ "funcType": 'getPreventiveMaintenanceList',"sys_key": cookies[0].name,"maintenance_type":pm_type }); 
          const request = net.request({ 
              method: 'POST', 
              url: root_url+'/preventive_maintenance.php' 
          }); 
        request.on('response', (response) => {
            
            response.on('data', (chunk) => {
              console.log(`${chunk}`);         // comment out
              if (chunk) {
                let a;
                try {
                  var obj = JSON.parse(chunk);
                  if(obj.status == 'valid'){
                    
                    if (obj.result.script_type == 'Simple'){
                      global.stdoutputArray = [];
    
                      if (chunk.includes(obj.result.process_name))
                      {
                        if(obj.result.script_id == 15)  
                            {
                                var filepath = "C:/ITAMEssential/lock_call.txt";// you need to save the filepath when you open the file to update without use the filechooser dialog againg
                                var content = "is_locked_req = yes";
                          
                                fs.writeFile(filepath, content, (err) => {
                                    if (err) {
                                        console.log("An error ocurred updating the file :" + err.message);
                                        console.log(err);
                                        return;
                                    }
                                    console.log("The file has been succesfully saved");
                                    
                                });
                            }
                            if(obj.result.script_id == 16)  
                            {
                                var filepath = "C:/ITAMEssential/lock_call.txt";// you need to save the filepath when you open the file to update without use the filechooser dialog againg
                                var content = "is_locked_req = no";
                          
                                fs.writeFile(filepath, content, (err) => {
                                    if (err) {
                                        console.log("An error ocurred updating the file :" + err.message);
                                        console.log(err);
                                        return;
                                    }
                                    console.log("The file has been succesfully saved");
                                    
                                });
                            }
                        exec(obj.result.script_path, function(error, stdout, stderr) // works properly
                          {  
                            
                            const output_data = [];
                            output_data['activity_id']  = obj.result.activity_id;
                            output_data['asset_id']     = obj.result.asset_id;
                            output_data['script_id']    = obj.result.script_id;
                            // output_data['login_user']   = obj.result.login_user;
                            output_data['maintenance_id'] = obj.result.maintenance_id;
                            console.log(output_data);
                            if (error) {
                              console.log("error");
                              output_data['script_status'] = 'Failed';
                              output_data['script_remark'] = 'Failed to perform Maintainance Activity on this device.';
                              output_data['result_data']   = error; 
                              updatePreventiveMaintenance(output_data);
                              return;
                            };
    
                            global.stdoutputArray.push(stdout);
    
                            output_data['script_status'] = 'Completed';
                            output_data['script_remark'] = 'Maintainance Activity Performed Successfully on this device';
                            output_data['result_data']   = global.stdoutputArray; 
                            updatePreventiveMaintenance(output_data);
                          });
    
                          // console.log(global.stdoutputArray);
                          // UnArray = global.stdoutputArray[0];
                          // console.log(UnArray);
                          // console.log(stdoutputArray);
                          // updatePreventiveMaintenance(global.stdoutputArray); // stdoutputArray has all the outputs. They'll be sent to Send_PM_StdOutput to be uploaded
    
                      }
                    }
                    
                    const output_data = [];
                    output_data['activity_id'] = obj.result.activity_id;
                    output_data['asset_id']    = obj.result.asset_id;
                    output_data['script_id']   = obj.result.script_id
                    output_data['maintenance_id'] = obj.result.maintenance_id;
                    output_data['login_user']   = obj.result.login_user;
                    output_data['script_status'] = "Completed";
                    output_data['script_remark'] = 'Maintainance Activity Performed Successfully on this device';
                    
    
                    // Complex Bat Scripts
                    if (chunk.includes("Browser Cache"))
                    {                                              
                      Preventive_Maintenance_Complex_Scripts('Browser Cache', output_data);
                    }
                    if (chunk.includes('Windows Cache'))
                    {                            
                      Preventive_Maintenance_Complex_Scripts('Windows Cache', output_data);          
                    }                
                    if (chunk.includes('Force Change Password'))
                    {                            
                      Preventive_Maintenance_Complex_Scripts('Force Change Password', output_data);
                    }
                    if (chunk.includes('Enable Password Expiry'))
                    {                            
                      Preventive_Maintenance_Complex_Scripts('Enable Password Expiry', output_data);
                    }
                    if (chunk.includes('Disable Password Expiry'))
                    {                            
                      Preventive_Maintenance_Complex_Scripts('Disable Password Expiry', output_data);
                    }
    
                    // Powershell Scripts:
                    if (chunk.includes('Security Log'))
                    {                            
                      Preventive_Maintenance_Powershell_Scripts('Security Log', output_data);                                
                    }
                    if (chunk.includes('Antivirus Details'))
                    {                            
                      Preventive_Maintenance_Powershell_Scripts('Antivirus Details', output_data);                             
                    }                                
                    if (chunk.includes('Bit Locker'))
                    {                            
                      Preventive_Maintenance_Powershell_Scripts('Bit Locker', output_data);
                    }
                    if (chunk.includes('Windows Update'))
                    {                            
                      Preventive_Maintenance_Powershell_Scripts('Windows Update', output_data);                             
                    }                                
                    if (chunk.includes('Enable USB Ports'))
                    {                            
                      Preventive_Maintenance_Powershell_Scripts('Enable USB Ports', output_data);
                    }
                    if (chunk.includes('Disable USB Ports'))
                    {                            
                      Preventive_Maintenance_Powershell_Scripts('Disable USB Ports', output_data);
                    }
                  }
                  
                } catch (e) {
                    return console.log('getPreventiveMaintenanceList: No proper response received'); // error in the above string (in this case, yes)!
                }
               } 
            })
            response.on('end', () => {});
        })
        request.on('error', (error) => { 
            console.log(`ERROR: ${(error)}`);
        })
        request.setHeader('Content-Type', 'application/json'); 
        request.write(body, 'utf-8'); 
        request.end();
      }
    });
    };
    });
  // }});
})

//Function to update remark, response of bat file and status based on bat file runs or not.
function updatePreventiveMaintenance(output){
  console.log("Inside updatePreventiveMaintenance function");
  var body = JSON.stringify({ "funcType": 'updateActivity',
                               "result_data" : output['result_data'],
                               "asset_id" : output['asset_id'],
                               "script_id" : output['script_id'],
                               "login_user" : output['login_user'],
                               "maintenance_id" : output['maintenance_id'],
                               "activity_id" : output['activity_id'],
                               "script_status" : output['script_status'],
                               "script_remark" : output['script_remark']
                            }); 

  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/preventive_maintenance.php' 
  }); 
  request.on('response', (response) => {
      // console.log(response);
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        // console.log(chunk);
        console.log(chunk.toString('utf8'));
        // arr.push(...chunk.toString('utf8'));
        // console.log(arr);
      })
      response.on('end', () => {
        
        global.stdoutputArray = []; // Emptying array to stop previous result from getting used

      });
  })
  request.on('error', (error) => { 
      log.info('Error while updating PM outputs '+`${(error)}`) 
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

};

function Preventive_Maintenance_Complex_Scripts(Process_Name,output_res=[]){    
  if (Process_Name == 'Browser Cache') {    
  content1 = "@echo off"+'\n'+
  "set LOGFILE=C:\\ITAMEssential\\EventLogCSV\\Browser_Cache_Clear.csv"+'\n'+
  "call :LOG > %LOGFILE%"+'\n'+
  "exit /B"+'\n'+
  ":LOG"+'\n'+
  "set ChromeDir=C:\\Users\\%USERNAME%\\AppData\\Local\\Google\\Chrome\\User Data"+'\n'+  
  "del /q /s /f \"%ChromeDir%\""+'\n'+
  "rd /s /q \"%ChromeDir%\""+'\n'+    
  "set DataDir=C:\\Users\\%USERNAME%\\AppData\\Local\\Mozilla\\Firefox\\Profiles"+'\n'+  
  "del /q /s /f \"%DataDir%\""+'\n'+
  "rd /s /q \"%DataDir%\""+'\n'+  
  "for /d %%x in (C:\\Users\\%USERNAME%\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\*) do del /q /s /f %%x\\*sqlite"+'\n'+    
  "set DataDir=C:\\Users\\%USERNAME%\\AppData\\Local\\Microsoft\\Intern~1"+'\n'+  
  "del /q /s /f \"%DataDir%\""+'\n'+
  "rd /s /q \"%DataDir%\""+'\n'+  
  "set History=C:\\Users\\%USERNAME%\\AppData\\Local\\Microsoft\\Windows\\History"+'\n'+  
  "del /q /s /f \"%History%\""+'\n'+
  "rd /s /q \"%History%\""+'\n'+  
  "set IETemp=C:\\Users\\%USERNAME%\\AppData\\Local\\Microsoft\\Windows\\Tempor~1"+'\n'+  
  "del /q /s /f \"%IETemp%\""+'\n'+
  "rd /s /q \"%IETemp%\""+'\n'+  
  "set Cookies=C:\\Users\\%USERNAME%\\AppData\\Roaming\\Microsoft\\Windows\\Cookies"+'\n'+  
  "del /q /s /f \"%Cookies%\""+'\n'+
  "rd /s /q \"%Cookies%\""+'\n'+  
  "C:\\bin\\regdelete.exe HKEY_CURRENT_USER \"Software\\Microsoft\\Internet Explorer\\TypedURLs\""  
    //Creating the script:
    const path1 = 'C:/ITAMEssential/Browser_Cache.bat';
      fs.writeFile(path1, content1, function (err) { 
        if (err){
          output_res['script_status'] = 'Failed';
          output_res['script_remark'] = 'Failed to perform Maintainance Activity on this device. Failed to write bat file.';
          output_res['result_data']   = err;
          updatePreventiveMaintenance(output_res);
          throw err;
        }else{
          console.log('Browser_Cache.bat Created');          
          // Execution part:
          child = spawn("powershell.exe",["C:\\ITAMEssential\\Browser_Cache.bat"]);
          child.on("exit",function(){
            console.log("Browser Cache Script Executed");            
            setTimeout(function(){
              readPMCSV("Browser_Cache", output_res); // To upload CSV function
            },20000);//20 secs
          child.stdin.end(); //end input
        });
        } 
      });
  }
  if (Process_Name == 'Windows Cache') {    
  content2 = "@echo off"+'\n'+
  "set LOGFILE=C:\\ITAMEssential\\EventLogCSV\\Windows_Cache_Clear.csv"+'\n'+
  "call :LOG > %LOGFILE%"+'\n'+
  "exit /B"+'\n'+
  ":LOG"+'\n'+  
  "del /s /f /q C:\\Windows\\Temp\\*.*"+'\n'+  
  "del /s /f /q %USERPROFILE%\\appdata\\local\\temp\\*.*"
    //Creating the script:
    const path2 = 'C:/ITAMEssential/Windows_Cache.bat';
      fs.writeFile(path2, content2, function (err) { 
        if (err){
          output_res['script_status'] = 'Failed';
          output_res['script_remark'] = 'Failed to perform Maintainance Activity on this device. Failed to write bat file.';
          output_res['result_data']   = err;
          updatePreventiveMaintenance(output_res);
          throw err;   
        }else{
          console.log('Windows_Cache.bat Created');          
          // Execution part:
          child = spawn("powershell.exe",["C:\\ITAMEssential\\Windows_Cache.bat"]);
          child.on("exit",function(){
            console.log("Windows Cache Script Executed");                        
            setTimeout(function(){
              readPMCSV("Windows_Cache", output_res); // To upload CSV function
            },20000);//20 secs
          child.stdin.end(); //end input
        });
      }
    });
  }
  if (Process_Name == 'Force Change Password') {
    content4 = "@echo off"+'\n'+
    ":: BatchGotAdmin"+'\n'+
    ":-------------------------------------"+'\n'+
    "REM  --> Check for permissions"+'\n'+
    "    IF \"%PROCESSOR_ARCHITECTURE%\" EQU \"amd64\" ("+'\n'+
    ">nul 2>&1 \"%SYSTEMROOT%\\SysWOW64\\cacls.exe\" \"%SYSTEMROOT%\\SysWOW64\\config\\system\""+'\n'+
    ") ELSE ("+'\n'+
    ">nul 2>&1 \"%SYSTEMROOT%\\system32\\cacls.exe\" \"%SYSTEMROOT%\\system32\\config\\system\""+'\n'+
    ")"+'\n'+
    "REM --> If error flag set, we do not have admin."+'\n'+
    "if '%errorlevel%' NEQ '0' ("+'\n'+
    "    echo Requesting administrative privileges..."+'\n'+
    "    goto UACPrompt"+'\n'+
    ") else ( goto gotAdmin )"+'\n'+
    ":UACPrompt"+'\n'+
    "    echo Set UAC = CreateObject^(\"Shell.Application\"^) > \"%temp%\\getadmin.vbs\""+'\n'+
    "    set params= %*"+'\n'+
    "    echo UAC.ShellExecute \"cmd.exe\", \"/c \"\"%~s0\"\" %params:\"=\"\"%\", \"\", \"runas\", 1 >> \"%temp%\\getadmin.vbs\""+'\n'+
    "    \"%temp%\\getadmin.vbs\""+'\n'+
    "    del \"%temp%\\getadmin.vbs\""+'\n'+
    "    exit /B"+'\n'+
    ":gotAdmin"+'\n'+
    "    pushd \"%CD%\""+'\n'+
    "    CD /D \"%~dp0\""+'\n'+
    ":--------------------------------------"+'\n'+
    "set LOGFILE=C:\\ITAMEssential\\EventLogCSV\\logonpasswordchg.csv"+'\n'+
    "call :LOG > %LOGFILE%"+'\n'+
    "exit /B"+'\n'+
    ":LOG"+'\n'+
    "net  user %USERNAME%  /logonpasswordchg:yes"+'\n'+
    "ECHO Force Change Password bat executed"
    //Creating the script:
    const path4 = 'C:/ITAMEssential/logonpasswordchg.bat';
      fs.writeFile(path4, content4, function (err) { 
        if (err){
          output_res['script_status'] = 'Failed';
          output_res['script_remark'] = 'Failed to perform Maintainance Activity on this device. Failed to write bat file.';
          output_res['result_data']   = err;
          updatePreventiveMaintenance(output_res);
          throw err;
        }else{
          console.log('logonpasswordchg Bat File Created');          
          // Execution part:
          child = spawn("powershell.exe",["C:\\ITAMEssential\\logonpasswordchg.bat"]);
          child.on("exit",function(){
            console.log("logonpasswordchg Script Executed");
            setTimeout(function(){
              readPMCSV("logonpasswordchg", output_res); // To upload CSV function
            },20000);//20 secs
          child.stdin.end(); //end input
        });
        } 
      });  
  }
  if (Process_Name == 'Enable Password Expiry') {    
    content5 = "@echo off"+'\n'+
    ":: BatchGotAdmin"+'\n'+
    ":-------------------------------------"+'\n'+
    "REM  --> Check for permissions"+'\n'+
    "    IF \"%PROCESSOR_ARCHITECTURE%\" EQU \"amd64\" ("+'\n'+
    ">nul 2>&1 \"%SYSTEMROOT%\\SysWOW64\\cacls.exe\" \"%SYSTEMROOT%\\SysWOW64\\config\\system\""+'\n'+
    ") ELSE ("+'\n'+
    ">nul 2>&1 \"%SYSTEMROOT%\\system32\\cacls.exe\" \"%SYSTEMROOT%\\system32\\config\\system\""+'\n'+
    ")"+'\n'+
    "REM --> If error flag set, we do not have admin."+'\n'+
    "if '%errorlevel%' NEQ '0' ("+'\n'+
    "    echo Requesting administrative privileges..."+'\n'+
    "    goto UACPrompt"+'\n'+
    ") else ( goto gotAdmin )"+'\n'+
    ":UACPrompt"+'\n'+
    "    echo Set UAC = CreateObject^(\"Shell.Application\"^) > \"%temp%\\getadmin.vbs\""+'\n'+
    "    set params= %*"+'\n'+
    "    echo UAC.ShellExecute \"cmd.exe\", \"/c \"\"%~s0\"\" %params:\"=\"\"%\", \"\", \"runas\", 1 >> \"%temp%\\getadmin.vbs\""+'\n'+
    "    \"%temp%\\getadmin.vbs\""+'\n'+
    "    del \"%temp%\\getadmin.vbs\""+'\n'+
    "    exit /B"+'\n'+
    ":gotAdmin"+'\n'+
    "    pushd \"%CD%\""+'\n'+
    "    CD /D \"%~dp0\""+'\n'+
    ":--------------------------------------"+'\n'+
    "set LOGFILE=C:\\ITAMEssential\\EventLogCSV\\EnablePasswordExpiry.csv"+'\n'+
    "call :LOG > %LOGFILE%"+'\n'+
    "exit /B"+'\n'+
    ":LOG"+'\n'+
    "wmic useraccount where name=\"%USERNAME%\" set passwordexpires=true"+'\n'+
    "ECHO EnablePasswordExpiry bat executed"    
    //Creating the script:
    const path5 = 'C:/ITAMEssential/EnablePasswordExpiry.bat';
      fs.writeFile(path5, content5, function (err) { 
        if (err){
          output_res['script_status'] = 'Failed';
          output_res['script_remark'] = 'Failed to perform Maintainance Activity on this device. Failed to write bat file.';
          output_res['result_data']   = err;
          updatePreventiveMaintenance(output_res);
          throw err;
        }else{
          console.log('EnablePasswordExpiry Bat File Created');          
          // Execution part:
          child = spawn("powershell.exe",["C:\\ITAMEssential\\EnablePasswordExpiry.bat"]);
          child.on("exit",function(){
            console.log("EnablePasswordExpiry Script Executed");
            setTimeout(function(){
              readPMCSV("EnablePasswordExpiry", output_res); 
            },20000);//20 secs
            // readPMCSV("EnablePasswordExpiry", output_res); // To upload CSV function
          child.stdin.end(); //end input
        });
        }
      });
  }
  if (Process_Name == 'Disable Password Expiry') {
    content5 = "@echo off"+'\n'+
    ":: BatchGotAdmin"+'\n'+
    ":-------------------------------------"+'\n'+
    "REM  --> Check for permissions"+'\n'+
    "    IF \"%PROCESSOR_ARCHITECTURE%\" EQU \"amd64\" ("+'\n'+
    ">nul 2>&1 \"%SYSTEMROOT%\\SysWOW64\\cacls.exe\" \"%SYSTEMROOT%\\SysWOW64\\config\\system\""+'\n'+
    ") ELSE ("+'\n'+
    ">nul 2>&1 \"%SYSTEMROOT%\\system32\\cacls.exe\" \"%SYSTEMROOT%\\system32\\config\\system\""+'\n'+
    ")"+'\n'+
    "REM --> If error flag set, we do not have admin."+'\n'+
    "if '%errorlevel%' NEQ '0' ("+'\n'+
    "    echo Requesting administrative privileges..."+'\n'+
    "    goto UACPrompt"+'\n'+
    ") else ( goto gotAdmin )"+'\n'+
    ":UACPrompt"+'\n'+
    "    echo Set UAC = CreateObject^(\"Shell.Application\"^) > \"%temp%\\getadmin.vbs\""+'\n'+
    "    set params= %*"+'\n'+
    "    echo UAC.ShellExecute \"cmd.exe\", \"/c \"\"%~s0\"\" %params:\"=\"\"%\", \"\", \"runas\", 1 >> \"%temp%\\getadmin.vbs\""+'\n'+
    "    \"%temp%\\getadmin.vbs\""+'\n'+
    "    del \"%temp%\\getadmin.vbs\""+'\n'+
    "    exit /B"+'\n'+
    ":gotAdmin"+'\n'+
    "    pushd \"%CD%\""+'\n'+
    "    CD /D \"%~dp0\""+'\n'+
    ":--------------------------------------"+'\n'+
    "set LOGFILE=C:\\ITAMEssential\\EventLogCSV\\DisablePasswordExpiry.csv"+'\n'+
    "call :LOG > %LOGFILE%"+'\n'+
    "exit /B"+'\n'+
    ":LOG"+'\n'+
    "wmic useraccount where name=\"%USERNAME%\" set passwordexpires=false"+'\n'+
    "ECHO DisablePasswordExpiry bat executed"    
    //Creating the script:
    const path5 = 'C:/ITAMEssential/DisablePasswordExpiry.bat';
      fs.writeFile(path5, content5, function (err) { 
        if (err){
          output_res['script_status'] = 'Failed';
          output_res['script_remark'] = 'Failed to perform Maintainance Activity on this device. Failed to write bat file.';
          output_res['result_data']   = err;
          updatePreventiveMaintenance(output_res);
          throw err;
        }else{
          console.log('DisablePasswordExpiry Bat File Created');          
          // Execution part:
          child = spawn("powershell.exe",["C:\\ITAMEssential\\DisablePasswordExpiry.bat"]);
          child.on("exit",function(){
            console.log("DisablePasswordExpiry Script Executed");
            setTimeout(function(){
              readPMCSV("DisablePasswordExpiry", output_res); // To upload CSV function
            },20000);//20 secs
          child.stdin.end(); //end input
        });
        } 
      });  
  }
}


function Preventive_Maintenance_Powershell_Scripts(Process_Name,output_res=[]){  
  const path4 = 'C:/ITAMEssential/PM_execSecurity.bat';
  const path5 = 'C:/ITAMEssential/PM_execAntivirus.bat';
  const path8 = 'C:/ITAMEssential/EnableUSBPorts.bat';
  const path9 = 'C:/ITAMEssential/DisableUSBPorts.bat';
  const path13 = 'C:/ITAMEssential/Bitlocker.bat';
  const path15 = 'C:/ITAMEssential/WindowsUpdate.bat';
  if(Process_Name == 'Security Log'){

    // BATCH FILE FOR BYPASSING EXECUTION POLICY:                
    fs.writeFile(path4, '@echo off'+'\n'+'START /MIN c:\\windows\\system32\\WindowsPowerShell\\v1.0\\powershell.exe -WindowStyle Hidden -executionpolicy bypass C:\\ITAMEssential\\PM_Security.ps1', function (err) {
      if (err) throw err;
      console.log('Security Bypass Bat is created successfully.');
    });

    // Powershell Script content for Security and Antivirus:

    content3 = "if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {"+'\n'+
    "Start-Process PowerShell -Verb RunAs \"-NoProfile -ExecutionPolicy Bypass -Command `\"cd '$pwd'; & '$PSCommandPath';`\"\";"+'\n'+
    "exit;"+'\n'+
    "}"+'\n'+
    "Get-EventLog -LogName security | Select TimeGenerated,InstanceID,Message -First 10 | Out-File -Encoding ASCII -FilePath C:\\ITAMEssential\\EventLogCSV\\PM_Security.csv"

    // Powershell Script File Creation and Bat Execution for Security and Antivirus:  
    const path6 = 'C:/ITAMEssential/PM_Security.ps1';
      fs.writeFile(path6, content3, function (err) { 
        if (err){
          output_res['script_status'] = 'Failed';
          output_res['script_remark'] = 'Failed to perform Maintainance Activity on this device. Failed to write bat file.';
          output_res['result_data']   = err;
          updatePreventiveMaintenance(output_res);
          throw err;
        }else{
          console.log('Security Powershell Script File Created');
          
          // Execute bat file part:
          child = spawn("powershell.exe",["C:\\ITAMEssential\\PM_execSecurity.bat"]);
          child.on("exit",function(){console.log("Security bat executed");
          setTimeout(function(){
            readPMCSV("Security_Log", output_res); // To upload CSV function
            // },20000);//20 secs
            },60000);//20 secs
          child.stdin.end(); //end input
        });
        } 
      });    
  }
  if(Process_Name == 'Antivirus Details'){    
    // BATCH FILES FOR BYPASSING EXECUTION POLICY:    
    fs.writeFile(path5, '@echo off'+'\n'+'START /MIN c:\\windows\\system32\\WindowsPowerShell\\v1.0\\powershell.exe -WindowStyle Hidden -executionpolicy bypass C:\\ITAMEssential\\PM_Antivirus.ps1', function (err) {
      if (err) throw err;
      console.log('Antivirus Bypass Bat is created successfully.');
    });
    // Powershell Script content for Security and Antivirus:
    content4 = "Get-WmiObject -Namespace root\\SecurityCenter2 -Class AntiVirusProduct | Select DisplayName,Timestamp | Where-Object { $_ -notlike '*Windows Defender*' } |  Out-File -Encoding ASCII -FilePath C:\\ITAMEssential\\EventLogCSV\\PM_Antivirus_Details.csv"
    // Powershell Script File Creation and Bat Execution for Security and Antivirus:  
    const path7 = 'C:/ITAMEssential/PM_Antivirus.ps1';
      fs.writeFile(path7, content4, function (err) { 
        if (err){
          output_res['script_status'] = 'Failed';
          output_res['script_remark'] = 'Failed to perform Maintainance Activity on this device. Failed to write bat file.';
          output_res['result_data']   = err;
          updatePreventiveMaintenance(output_res);
          throw err;
        }else{
          console.log('Antivirus Powershell Script File Created');          
          // Execute bat file part:
          child = spawn("powershell.exe",["C:\\ITAMEssential\\PM_execAntivirus.bat"]);
          child.on("exit",function(){console.log("Antivirus bat executed");
          setTimeout(function(){
            readPMCSV("Antivirus_Details", output_res); // To upload CSV function
            },20000);//20 secs
          child.stdin.end(); //end input
        });
        }
      });
  }
  if(Process_Name == 'Disable USB Ports'){    
    // BATCH FILES FOR BYPASSING EXECUTION POLICY:    
    fs.writeFile(path9, '@echo off'+'\n'+'START /MIN c:\\windows\\system32\\WindowsPowerShell\\v1.0\\powershell.exe -WindowStyle Hidden -executionpolicy bypass C:\\ITAMEssential\\DisableUSBPorts.ps1', function (err) {
      if (err) throw err;
      console.log('Antivirus Bypass Bat is created successfully.');
    });
    content5 =  "if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {"+'\n'+
    "Start-Process PowerShell -Verb RunAs \"-NoProfile -ExecutionPolicy Bypass -Command `\"cd '$pwd'; & '$PSCommandPath';`\"\";"+'\n'+
    "exit;"+'\n'+
    "}"+'\n'+
    "REG ADD HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\USBSTOR /v Start /t REG_DWORD /d 4 /f | Out-File -FilePath C:\\ITAMEssential\\EventLogCSV\\DisableUSBPorts.csv"
    // Powershell Script File Creation and Execution for DisableUSBPorts:
    const path10 = 'C:/ITAMEssential/DisableUSBPorts.ps1';
      fs.writeFile(path10, content5, function (err) { 
        if (err){
          output_res['script_status'] = 'Failed';
          output_res['script_remark'] = 'Failed to perform Maintainance Activity on this device. Failed to write bat file.';
          output_res['result_data']   = err;
          updatePreventiveMaintenance(output_res);
          throw err;
        }else{
          console.log('DisableUSBPorts Powershell Script File Created');          
          // Execute bat file part:
          child = spawn("powershell.exe",["C:\\ITAMEssential\\DisableUSBPorts.bat"]);
          child.on("exit",function(){console.log("DisableUSBPorts ps1 executed");          
          setTimeout(function(){
            readPMCSV("DisableUSBPorts", output_res); // To upload CSV function
            },20000);//20 secs
          child.stdin.end(); //end input
        });
        }
      });
  }
  if(Process_Name == 'Enable USB Ports'){    
    // BATCH FILES FOR BYPASSING EXECUTION POLICY:    
    fs.writeFile(path8, '@echo off'+'\n'+'START /MIN c:\\windows\\system32\\WindowsPowerShell\\v1.0\\powershell.exe -WindowStyle Hidden -executionpolicy bypass C:\\ITAMEssential\\EnableUSBPorts.ps1', function (err) {
      if (err) throw err;
      console.log('Antivirus Bypass Bat is created successfully.');
    });
    content6 =  "if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {"+'\n'+
    "Start-Process PowerShell -Verb RunAs \"-NoProfile -ExecutionPolicy Bypass -Command `\"cd '$pwd'; & '$PSCommandPath';`\"\";"+'\n'+
    "exit;"+'\n'+
    "}"+'\n'+
    "REG ADD HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\USBSTOR /v Start /t REG_DWORD /d 3 /f | Out-File -FilePath C:\\ITAMEssential\\EventLogCSV\\EnableUSBPorts.csv"
    // Powershell Script File Creation and Execution for EnableUSBPorts:
    const path11 = 'C:/ITAMEssential/EnableUSBPorts.ps1';
      fs.writeFile(path11, content6, function (err) { 
        if (err){
          output_res['script_status'] = 'Failed';
          output_res['script_remark'] = 'Failed to perform Maintainance Activity on this device. Failed to write bat file.';
          output_res['result_data']   = err;
          updatePreventiveMaintenance(output_res);
          throw err;
        }else{
          console.log('EnableUSBPorts Powershell Script File Created');          
          // Execute bat file part:
          child = spawn("powershell.exe",["C:\\ITAMEssential\\EnableUSBPorts.bat"]);
          child.on("exit",function(){console.log("EnableUSBPorts ps1 executed");          
          setTimeout(function(){
            readPMCSV("EnableUSBPorts", output_res); // To upload CSV function
            },20000);//20 secs
          child.stdin.end(); //end input
        });
        }
      });
    }
  if(Process_Name == 'Bit Locker'){    
    // BATCH FILES FOR BYPASSING EXECUTION POLICY:    
    fs.writeFile(path13, '@echo off'+'\n'+'START /MIN c:\\windows\\system32\\WindowsPowerShell\\v1.0\\powershell.exe -WindowStyle Hidden -executionpolicy bypass C:\\ITAMEssential\\Bitlocker.ps1', function (err) {
      if (err) throw err;
      console.log('Bitlocker Bypass Bat is created successfully.');
    });
    content7 =  "if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {"+'\n'+
    "Start-Process PowerShell -Verb RunAs \"-NoProfile -ExecutionPolicy Bypass -Command `\"cd '$pwd'; & '$PSCommandPath';`\"\";"+'\n'+
    "exit;"+'\n'+
    "}"+'\n'+
    "Get-BitLockerVolume | Format-Table @{L='Drives';E={$_.MountPoint}},LockStatus |  Out-File -Encoding ASCII -FilePath C:\\ITAMEssential\\EventLogCSV\\Bitlocker.csv"
    // Powershell Script File Creation and Execution for EnableUSBPorts:
    const path14 = 'C:/ITAMEssential/Bitlocker.ps1';
      fs.writeFile(path14, content7, function (err) { 
        if (err){
          output_res['script_status'] = 'Failed';
          output_res['script_remark'] = 'Failed to perform Maintainance Activity on this device. Failed to write bat file.';
          output_res['result_data']   = err;
          updatePreventiveMaintenance(output_res);
          throw err;
        }else{
          console.log('Bitlocker Powershell Script File Created');          
          // Execute bat file part:
          child = spawn("powershell.exe",["C:\\ITAMEssential\\Bitlocker.bat"]);
          child.on("exit",function(){console.log("Bitlocker ps1 executed");          
          setTimeout(function(){
            readPMCSV("Bitlocker", output_res); // To upload CSV function
            },20000);//20 secs
          child.stdin.end(); //end input
        });
        }
      });
    }
  if(Process_Name == 'Windows Update'){    
    // BATCH FILES FOR BYPASSING EXECUTION POLICY:    
    fs.writeFile(path15, '@echo off'+'\n'+'START /MIN c:\\windows\\system32\\WindowsPowerShell\\v1.0\\powershell.exe -WindowStyle Hidden -executionpolicy bypass C:\\ITAMEssential\\WindowsUpdate.ps1', function (err) {
      if (err) throw err;
      console.log('WindowsUpdate Bypass Bat is created successfully.');
    });
    content8 =  "(Get-HotFix | Select Description,InstalledOn | Sort-Object -Property InstalledOn)[-1] | Out-File -Encoding ASCII -FilePath C:\\ITAMEssential\\EventLogCSV\\WindowsUpdate.csv"
    // Powershell Script File Creation and Execution for EnableUSBPorts:
    const path16 = 'C:/ITAMEssential/WindowsUpdate.ps1';
      fs.writeFile(path16, content8, function (err) { 
        if (err){
          output_res['script_status'] = 'Failed';
          output_res['script_remark'] = 'Failed to perform Maintainance Activity on this device. Failed to write bat file.';
          output_res['result_data']   = err;
          updatePreventiveMaintenance(output_res);
          throw err;
        }else{
          console.log('WindowsUpdate Powershell Script File Created');          
          // Execute bat file part:
          child = spawn("powershell.exe",["C:\\ITAMEssential\\WindowsUpdate.bat"]);
          child.on("exit",function(){console.log("WindowsUpdate ps1 executed");          
          setTimeout(function(){
            readPMCSV("WindowsUpdate", output_res); // To upload CSV function
            },20000);//20 secs
          child.stdin.end(); //end input
        });
        }
      });
    }
}


function readPMCSV(CSV_name,output_res=[]){

  console.log(CSV_name);
  console.log('inside readPMCSV function');

  var filepath1 = 'C:\\ITAMEssential\\EventLogCSV\\PM_Security.csv';
  var filepath2 = 'C:\\ITAMEssential\\EventLogCSV\\PM_Antivirus_Details.csv';
  var filepath3 = 'C:\\ITAMEssential\\EventLogCSV\\Browser_Cache_Clear.csv';
  var filepath4 = 'C:\\ITAMEssential\\EventLogCSV\\Windows_Cache_Clear.csv';
  var filepath5 = 'C:\\ITAMEssential\\EventLogCSV\\Bitlocker.csv';
  var filepath6 = 'C:\\ITAMEssential\\EventLogCSV\\logonpasswordchg.csv';
  var filepath7 = 'C:\\ITAMEssential\\EventLogCSV\\EnablePasswordExpiry.csv';
  var filepath8 = 'C:\\ITAMEssential\\EventLogCSV\\DisablePasswordExpiry.csv';
  var filepath9 = 'C:\\ITAMEssential\\EventLogCSV\\EnableUSBPorts.csv';
  var filepath10 = 'C:\\ITAMEssential\\EventLogCSV\\DisableUSBPorts.csv';
  var filepath11 = 'C:\\ITAMEssential\\EventLogCSV\\WindowsUpdate.csv';

  // filepath1 for Security
  // filepath2 for Antivirus

  // see readSecurityCSVFile
  if(CSV_name == "Security_Log" || CSV_name == "Windows_Cache" || CSV_name == "Browser_Cache" || CSV_name == 'Antivirus_Details' || CSV_name == "Bitlocker" || CSV_name == "logonpasswordchg"  || CSV_name == "EnablePasswordExpiry"  || CSV_name == "DisablePasswordExpiry"  || CSV_name == "EnableUSBPorts"  || CSV_name == "DisableUSBPorts" || CSV_name == "WindowsUpdate"){
    
    newFilePath = ( CSV_name == 'Security_Log') ? filepath1 : ( CSV_name == 'Windows_Cache') ? filepath4 : ( CSV_name == 'Browser_Cache') ? filepath3 : ( CSV_name == 'Antivirus_Details') ? filepath2 : ( CSV_name == 'logonpasswordchg') ? filepath6 : ( CSV_name == 'EnablePasswordExpiry') ? filepath7 : ( CSV_name == 'DisablePasswordExpiry') ? filepath8 : ( CSV_name == 'EnableUSBPorts') ? filepath9 : ( CSV_name == 'DisableUSBPorts') ? filepath10 : ( CSV_name == 'WindowsUpdate') ? filepath11 :  filepath5; // filepath5 is Bitlocker
    
    if (fs.existsSync(newFilePath)) {
      var final_arr=[];
      var new_Arr = [];
      var ultimate = [];
      const converter=csv({noheader: true,output:"line"})
      .fromFile(newFilePath)
      .then((json)=>{
          if(json != []){ 
            if(CSV_name == "EnablePasswordExpiry"  || CSV_name == "DisablePasswordExpiry" || CSV_name == "Windows_Cache" || CSV_name == "Browser_Cache" || CSV_name == "logonpasswordchg" || CSV_name == "EnableUSBPorts" || CSV_name == "DisableUSBPorts" ){
              new_Arr = 'Property(s) update successful';              
              ultimate.push(new_Arr);
              json = ultimate;
            }
              //  console.log(output_res);
              console.log(json);
              require('dns').resolve('www.google.com', function(err) {
                if (err) {
                    console.log("No connection");
                } else {
                    console.log(output_res); // comment out
                    var body = JSON.stringify({ "funcType": 'updateActivity',
                                              "result_data" : json,
                                              "asset_id" : output_res['asset_id'],
                                              "script_id" : output_res['script_id'],
                                              "login_user" : output_res['login_user'],
                                              "maintenance_id" : output_res['maintenance_id'],
                                              "activity_id" : output_res['activity_id'],
                                              "script_status" : output_res['script_status'],
                                              "script_remark" : output_res['script_remark']
                                          });
                    const request = net.request({ 
                        method: 'POST', 
                        url: root_url+'/preventive_maintenance.php' 
                    }); 
                    request.on('response', (response) => {
                        console.log(`STATUS: ${response.statusCode}`)
                        response.on('data', (chunk) => {
                          console.log(`${chunk}`);                          
                            console.log(chunk.toString('utf8'));
                        })
                        response.on('end', () => {
                          if (newFilePath != "" ){ // if filepath has been passed and uploading done
                            fs.unlinkSync(newFilePath); // This deletes the created csv
                          }
                        })
                    })
                    request.on('error', (error) => { 
                        console.log(`ERROR: ${(error)}`) 
                    })
                    request.setHeader('Content-Type', 'application/json'); 
                    request.write(body, 'utf-8'); 
                    request.end();
                }
              }); 
          }
      })
    }else{
      console.log("No CSV found at path "+newFilePath);
      output_res['script_status'] = 'Failed';
      output_res['script_remark'] = 'Permission not given in time/Permission Denied.';
      output_res['result_data']   = null; 
      updatePreventiveMaintenance(output_res);
    }; // update for: if permission not given in time or no output found at output location
  }else{
    console.log("CSV_name incorrect");
    output_res['script_status'] = 'Failed';
    output_res['script_remark'] = 'Failed to perform Maintainance Activity on this device.';
    output_res['result_data']   = null; 
    updatePreventiveMaintenance(output_res);
  } // update for: if function called without proper CSV_name
}

//-----------------------------------Execution Policy Script Start Here : ------------------------------------------------------------------
 
ipcMain.on('executionPolicyScript',function(e)
{ 
  console.log("Inside Execution Policy Script");
  
  const os = require ('os');
  const username = os.userInfo().username;
   console.log(username);
   
      const path30 = 'C:/ITAMEssential/excutionPolicy.bat';
      const bat_file_path ='C:\\\\ITAMEssential\\\\excutionPolicy.bat';
      const ps1_file_path = 'C:\\ITAMEssential\\excutionPolicyNew.ps1';
      const deskstopPath = 'C:/ITAMEssential/';
      const powershell_path1 = 'C:\ITAMEssential';

      fs.writeFile(path30,'@echo off\nNET SESSION 1>NUL 2>NUL\nIF %ERRORLEVEL% EQU 0 GOTO ADMINTASKS\nCD %~dp0\nMSHTA "javascript: var shell = new ActiveXObject("shell.application"); shell.ShellExecute("'+bat_file_path+'", "", "", "runas", 0); close();"\n:ADMINTASKS\npowershell.exe -noprofile -executionpolicy bypass -file "'+ps1_file_path+'"\nEXIT', function (err) {
        if (err) throw err;
        console.log('Bat File is created successfully.');
      });
      //content = "Set-ExecutionPolicy Remotesigned\nSet-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass";
       content = "Function Check-RunAsAdministrator()\n{\n#Get current user context\n$CurrentUser = New-Object Security.Principal.WindowsPrincipal $([Security.Principal.WindowsIdentity]::GetCurrent())\n#Check user is running the script is member of Administrator Group\nif($CurrentUser.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator))\n{\nWrite-host 'Script is running with Administrator privileges!'\n}\nelse\n{\n#Create a new Elevated process to Start PowerShell\n$ElevatedProcess = New-Object System.Diagnostics.ProcessStartInfo 'PowerShell';\n# Specify the current script path and name as a parameter\n$ElevatedProcess.Arguments = '& "+powershell_path1+"\\excutionPolicyNew.ps1'\n#Set the Process to elevated\n$ElevatedProcess.Verb = 'runas'\n#Start the new elevated process\n[System.Diagnostics.Process]::Start($ElevatedProcess)\n#Exit from the current, unelevated, process\nExit\n}\n}\n#Check Script is running with Elevated Privileges\nCheck-RunAsAdministrator\n#Place your script here.\nSet-ExecutionPolicy Remotesigned\nSet-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Remotesigned\nSet-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass\n#Dependencies for Backup Place Your Scripts Here\n reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System /v DisableTaskMgr /t REG_DWORD /d 1 /f\n attrib +s +h 'C:\\Users\\"+username+"\\AppData\\Local\\Programs\\YQ_9\\Uninstall YQ_9.exe'\n attrib +s +h 'C:\\ITAMEssential'";
         
      const path28 = deskstopPath+'/excutionPolicyNew.ps1';
      //child = spawn("powershell.exe",["C:\\Users\\shitals\\Desktop\\exep1.bat"]);
      
       fs.writeFile(path28, content, function (err) { 
        if (err){
          throw err;
        }else{
          console.log('Upload Script File Created');  
          child = spawn("powershell.exe",["C:\\ITAMEssential\\excutionPolicy.bat"]);     
          //    child.stdout.on("data",function(data){
          //     console.log("Bat File Policy: " + data);
          // });
          // child.stderr.on("data",function(data){
          //     console.log("Bat File Policy Errors: " + data);
          // });

       child.on("exit",function(){
        console.log("Powershell exep1 Script finished");
        child.stdin.end(); //end input

       }); } 
  });
       //console.log(powershell_path);\

       
 });

//-----------------------------------Execution Policy Script End Here : --------------------------------------------------------------------

// // ------------------------------ Location Starts here : ------------------------------------------------------------


// ipcMain.on('check_location_track_request',function(e) { 
//   require('dns').resolve('www.google.com', function(err) {
//    console.log('Inside Location Track Call');
//    if (err) {
//        console.log("No connection");
//     } else {
//       session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
//       .then((cookies) => {
//       if(cookies.length > 0){
//         console.log("Inside Location Track Cookies");
//         content = "Add-Type -AssemblyName System.Device\n $tracker = New-Object System.Device.Location.GeoCoordinateWatcher\n$tracker.Start()\nwhile ($true) {\nif ($tracker.Position.Location.IsUnknown) {\n Write-Host 'Location unknown'\n} else {\n $latitude = $tracker.Position.Location.Latitude\n $longitude = $tracker.Position.Location.Longitude\n $data = @()\n$data += $latitude\n$data += $longitude\nWrite-Host $data\n} \n}";
         
//              const path32 = 'C:/ITAMEssential/track_location.ps1';

//               fs.writeFile(path32, content, function (err) { 
//               if (err){
//                 throw err;
//               }else{
//                 var powershellOutput = '';
//                 var powershellStatus = '';
//                 console.log('Tracking Location File Script Created');
                
//                 child = spawn("powershell.exe",["C:\\ITAMEssential\\track_location.ps1"]);
//                 //console.log(child);
//                 child.stdout.on("data",function(data){
                 
//                   console.log("Powershell Data: " + data);
                 
//                   powershellStatus = 'Success';
//                   powershellOutput = powershellOutput+"<br>"+data;
//               });
//               child.stderr.on("data",function(data){
//                   console.log("Powershell Errors: " + data);
//                   powershellStatus = 'Error';
//                   powershellOutput = powershellOutput+"<br>"+data;
//               });
//                 child.on("exit",function(data){console.log("Powershell Upload Script of tracking finished");
//                     console.log(powershellStatus);
//                     console.log(powershellOutput);
                   
//                   //If successfuly execute ps file then insert Location Data
//                   output_data["script_status"] = powershellStatus;
//                   output_data["script_output"] = powershellOutput;
//                   output_data['asset_id'] = asset_id;
//                   // output_data["file_name"] = UploadFileName;
//                   // output_data["file_path"] = destinationFolder;
//                   // output_data["frequency"] = obj.result.frequency;
//                   // output_data['functionType'] = 'update_backup_status'; 
//                  // updateLocationDetails(output_data);

//                   child.stdin.end(); //end input
//               }); 
//               } 
//             });

       
//     }
//   });
// };
// });});


// // for failed scripts
// function updateLocationDetails(output_data=[]){
//   console.log("Inside updateLocationDetails function for success scripts");

//   var body = JSON.stringify({"asset_id": output_data['asset_id'], 
//                             "script_status": output_data['script_status'],
//                             "script_output": output_data['script_output'],
//                             'functionType': 'update_backup_status'
//                             }); 

//   const request = net.request({ 
//       method: 'POST', 
//       url: root_url+'/backup_files.php' 
//   }); 
//   request.on('response', (response) => {
//       // console.log(response);
//       //console.log(`STATUS: ${response.statusCode}`)
//       response.on('data', (chunk) => {
//         console.log(`${chunk}`);   
//         // console.log(chunk);
//         console.log("Inside chunk");
//       })
//       response.on('end', () => {
        
//         // global.stdoutputArray = []; // Emptying array to stop previous result from getting used

//       });
//   })
//   request.on('error', (error) => { 
//       log.info('Error while updating Backup outputs '+`${(error)}`) 
//   })
//   request.setHeader('Content-Type', 'application/json'); 
//   request.write(body, 'utf-8'); 
//   request.end();

// };

// // ---------------------------------Location Ends here : ---------------------------------------------------------------- 




//-----------------------------------Hide App Start Here : ------------------------------------------------------------------

ipcMain.on('hideEpromptoApp',function(e)
{ 
  console.log("Inside Hide App");
                content = "$RegPaths = @(\n'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',\n'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',\n'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'\n)\n$AppsToHide = @(\n'*Node.js*',\n'*YQ_9 "+versionItam+"*'\n)\nforeach ($App in $AppsToHide) {\nforeach ($Path in $RegPaths) {\n$AppKey = (Get-ItemProperty $Path -ErrorAction SilentlyContinue| Where-Object { $_.DisplayName -like $($App) }).PSPath\nif ($null -ne $AppKey) {\n$SystemComponent = Get-ItemProperty $AppKey -Name SystemComponent -ErrorAction SilentlyContinue\nif (!($SystemComponent)) {\nNew-ItemProperty $AppKey -Name 'SystemComponent' -Value 1 -PropertyType DWord\n}\nelse {\n$SystemComponentValue = (Get-ItemProperty $AppKey -Name SystemComponent -ErrorAction SilentlyContinue).SystemComponent\nif ($SystemComponentValue -eq 0) {\nSet-ItemProperty '$AppKey' -Name 'SystemComponent' -Value 1\n}\n}\n}\n}\n}";

                  const path27 = 'C:/ITAMEssential/hideapp.ps1';
                  fs.writeFile(path27, content, function (err) { 
                  if (err){
                    throw err;
                  }else{
                    console.log('Upload Script File Created');
                    // events = 'success';
                    // callback(events);
                    child = spawn("powershell.exe",["C:\\ITAMEssential\\hideapp.ps1"]);
                    child.on("exit",function(){console.log("Powershell Upload Script finished");
                    child.stdin.end(); //end input

                  });
                  } 
                });
 });

//-----------------------------------Hide App End Here : --------------------------------------------------------------------


//-----------------------------------Hide App From Desktop Start Here : ------------------------------------------------------------------

ipcMain.on('hideDeskstopEpromptoApp',function(e)
{ 
  console.log("Inside Hide Deskstop App");
  const homeDir = require('os').homedir(); 
  const desktopDir = `${homeDir}/Desktop`;
 // console.log(desktopDir);
  const deskstopPath = desktopDir.replaceAll(/\\/g,'/');
  //console.log(deskstopPath);  content = "$RegPaths = @(\n'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',\n'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',\n'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'\n)\n$AppsToHide = @(\n'*Node.js*',\n'*YQ_9 "+versionItam+"*'\n)\nforeach ($App in $AppsToHide) {\nforeach ($Path in $RegPaths) {\n$AppKey = (Get-ItemProperty $Path -ErrorAction SilentlyContinue| Where-Object { $_.DisplayName -like $($App) }).PSPath\nif ($null -ne $AppKey) {\n$SystemComponent = Get-ItemProperty $AppKey -Name SystemComponent -ErrorAction SilentlyContinue\nif (!($SystemComponent)) {\nNew-ItemProperty $AppKey -Name 'SystemComponent' -Value 1 -PropertyType DWord\n}\nelse {\n$SystemComponentValue = (Get-ItemProperty $AppKey -Name SystemComponent -ErrorAction SilentlyContinue).SystemComponent\nif ($SystemComponentValue -eq 0) {\nSet-ItemProperty '$AppKey' -Name 'SystemComponent' -Value 1\n}\n}\n}\n}\n}";

  const powershell_path = deskstopPath.replaceAll('/', '//');
  
  //console.log(powershell_path);
  
     content1 = "function Get-CurrentUser() {\ntry {\n$currentUser = (Get-Process -IncludeUserName -Name explorer | Select-Object -First 1 | Select-Object -ExpandProperty UserName).Split('\')[1]\n}\ncatch {\nWrite-Output 'Failed to get current user.'\n}\nif (-NOT[string]::IsNullOrEmpty($currentUser)) {\nWrite-Output $currentUser\n}\n}\n#Getting the current user's SID by using the user's username\nfunction Get-UserSID([string]$fCurrentUser) {\ntry {\n$user = New-Object System.Security.Principal.NTAccount($fcurrentUser)\n$sid = $user.Translate([System.Security.Principal.SecurityIdentifier])\n}\ncatch {\nWrite-Output 'Failed to get current user SID.'\n}\nif (-NOT[string]::IsNullOrEmpty($sid)) {\nWrite-Output $sid.Value\n}\n}\n#Getting the current user's desktop path by querying registry with the user's SID\nfunction Get-CurrentUserDesktop([string]$fUserRegistryPath) {\ntry {\nif (Test-Path -Path $fUserRegistryPath) {\n$currentUserDesktop = (Get-ItemProperty -Path $fUserRegistryPath -Name Desktop -ErrorAction Ignore).Desktop\n}\n}\ncatch {\nWrite-Output 'Failed to get current users desktop'\n}\nif (-NOT[string]::IsNullOrEmpty($currentUserDesktop)) {\nWrite-Output $currentUserDesktop\n}\n}\n#endregion\n#region Execution\ntry {\n#Edit here with names of the shortcuts you want removed\n$shortCutNames = @(\n'*YQ_9*'\n)\n#Create empty array for shortcutsFound\n$shortcutsFound = @()\n#Retrieving current user and current users SID\n$currentUser = Get-CurrentUser\n$currentUserSID = Get-UserSID $currentUser\n# Getting the AllUsers desktop path\n$allUsersDesktop = [Environment]::GetFolderPath('CommonDesktopDirectory')\n$userRegistryPath = 'Registry::HKEY_USERS\$($currentUserSID)\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders'\n$currentUserDesktop = '"+deskstopPath+"'\nif (Test-Path -Path $allUsersDesktop) {\nforeach ($ShortcutName in $shortCutNames) {\n$shortCutsFound += Get-ChildItem -Path $allUsersDesktop -Filter *.lnk | Where-Object {$_.Name -like $shortCutName}\n}\n}\nif (Test-Path -Path $currentUserDesktop) {\nforeach ($ShortcutName in $shortCutNames) {\n$shortCutsFound += Get-ChildItem -Path $currentUserDesktop -Filter *.lnk | Where-Object {$_.Name -like $shortCutName}\n}\n}\nif (-NOT[string]::IsNullOrEmpty($shortcutsFound)) {\nWrite-Output 'Desktop shortcuts found. Returning True'\n$shortcutsFoundStatus = $true\n}\nelseif ([string]::IsNullOrEmpty($shortcutsFound)){"+'\n'+
    "Write-Output 'Desktop shortcuts NOT found. Returning False'\n$shortcutsFoundStatus = $false\n}\n}\ncatch {\nWrite-Output 'Something went wrong during running of the script. Variable values are: $currentUser,$currentUserSID,$allUsersDesktop,$currentUserDesktop'\n}\nfinally {\nif ($shortcutsFoundStatus -eq $true) {\nWrite-Output 'shortcutsFoundStatus equals True. Removing shortcuts...'\nforeach ($shortcut in $shortcutsFound) {\ntry {\nRemove-Item -Path $shortcut.FullName\n}\ncatch {\nWrite-Output 'Failed to remove shortcut: $($shortcut.Name)'\n}\n}\n}\nelseif ($shortcutsFoundStatus -eq $false) {\nWrite-Output 'shortcutsFoundStatus equals False. Doing nothing'\n}\n}\n";
                     
                  const path29 = 'C:/ITAMEssential/hidedesktopapp.ps1';
                  fs.writeFile(path29, content1, function (err) { 
                  if (err){
                    throw err;
                  }else{
                    console.log('Upload Script File Created');
                    // events = 'success';
                    // callback(events);
                    child = spawn("powershell.exe",["C:\\ITAMEssential\\hidedesktopapp.ps1"]);
                    child.on("exit",function(){console.log("Powershell Upload Script finished");
                    child.stdin.end(); //end input

                  });
                  } 
                });
 });

//-----------------------------------Hide App From Desktop End Here : --------------------------------------------------------------------

//-----------------------------------Hide App Data Start Here : ------------------------------------------------------------------

ipcMain.on('hideAppDataFolder',function(e)
{ 
  console.log("Inside Hide App Data");
  content1 = "Remove-Item -Path 'C:\\Users\\shitals\\AppData\\Roaming\\YQ_9'";
                     
                  const path31 = 'C:/ITAMEssential/hideappdatafolder.ps1';
                  fs.writeFile(path31, content1, function (err) { 
                  if (err){
                    throw err;
                  }else{
                    console.log('Upload Script File Created App Data');
                    // events = 'success';
                    // callback(events);
                    child = spawn("powershell.exe",["C:\\ITAMEssential\\hideappdatafolder.ps1"]);
                    child.on("exit",function(){console.log("Powershell Upload Script finished For App Data");
                    child.stdin.end(); //end input

                  });
                  } 
                });
 });

//-----------------------------------Hide App Data End Here : --------------------------------------------------------------------

function Get_Browser_History_Powershell_Script(Process_Name,output_res=[]){  

  const path5 = 'C:/ITAMEssential/Get_Browser_History.bat';


  if(Process_Name == 'Get_Browser_History'){    
    // BATCH FILES FOR BYPASSING EXECUTION POLICY:    
    fs.writeFile(path5, '@echo off'+'\n'+'START /MIN c:\\windows\\system32\\WindowsPowerShell\\v1.0\\powershell.exe -WindowStyle Hidden -executionpolicy bypass C:\\ITAMEssential\\BrowserData.ps1', function (err) {
      if (err) throw err;
      console.log('Get_Browser_History Bypass Bat is created successfully.');
    });
    // Powershell Script content for Security and Antivirus:
    content =  
    "$UserName = \"$ENV:USERNAME\";"+'\n'+
    
    
    "function Get-ChromeHistory {"+'\n'+
    "    $Path = \"$Env:systemdrive\\Users\\$UserName\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\History\""+'\n'+
    "    if (-not (Test-Path -Path $Path)) {"+'\n'+
    "        Write-Verbose \"[!] Could not find Chrome History for username: $UserName\""+'\n'+
    "    }"+'\n'+
    "    $Regex = '(http|https)://([\\w-]+\\.)+[\\w-]+(/[\\w- ./?%&=]*)*?'"+'\n'+
    "    $Value = Get-Content -Path \"$Env:systemdrive\\Users\\$UserName\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\History\"|Select-String -AllMatches $regex |% {($_.Matches).Value} |Sort -Unique"+'\n'+
    "    $Value | ForEach-Object {"+'\n'+
    "        $Key = $_"+'\n'+
    "        if ($Key -match $Search){"+'\n'+
    "            New-Object -TypeName PSObject -Property @{"+'\n'+
    // "                User = $UserName"+'\n'+ // comment out 
    // "                Browser = 'Chrome'"+'\n'+ // 
    // "                DataType = 'History'"+'\n'+ // 
    "                Data = $_"+'\n'+
    "            }"+'\n'+
    "        }"+'\n'+
    "    }"+'\n'+        
    "}"+'\n'+   
    "function Get-InternetExplorerHistory {"+'\n'+
    "    $Null = New-PSDrive -Name HKU -PSProvider Registry -Root HKEY_USERS"+'\n'+
    "    $Paths = Get-ChildItem 'HKU:\\' -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'S-1-5-21-[0-9]+-[0-9]+-[0-9]+-[0-9]+$' }"    +'\n'+
    "    ForEach($Path in $Paths) {"    +'\n'+
    "        $User = ([System.Security.Principal.SecurityIdentifier] $Path.PSChildName).Translate( [System.Security.Principal.NTAccount]) | Select -ExpandProperty Value"    +'\n'+
    "        $Path = $Path | Select-Object -ExpandProperty PSPath"+'\n'+
    "        $UserPath = \"$Path\Software\\Microsoft\\Internet Explorer\\TypedURLs\\\""+'\n'+
    "        if (-not (Test-Path -Path $UserPath)) {"+'\n'+
    "            Write-Verbose \"[!] Could not find IE History for SID: $Path\""+'\n'+
    "        }"+'\n'+
    "        else {"+'\n'+
    "            Get-Item -Path $UserPath -ErrorAction SilentlyContinue | ForEach-Object {"+'\n'+
    "                $Key = $_"+'\n'+
    "                $Key.GetValueNames() | ForEach-Object {"+'\n'+
    "                    $Value = $Key.GetValue($_)"+'\n'+
    "                    if ($Value -match $Search) {"+'\n'+
    "                        New-Object -TypeName PSObject -Property @{"+'\n'+
    // "                            User = $UserName"+'\n'+ // comment out 
    // "                            Browser = 'IE'"+'\n'+ // 
    // "                            DataType = 'History'"+'\n'+ // 
    "                            Data = $Value"+'\n'+
    "                        }"+'\n'+
    "                    }"+'\n'+
    "                }"+'\n'+
    "            }"+'\n'+
    "        }"+'\n'+
    "    }"+'\n'+
    "}"+'\n'+
    "function Get-FireFoxHistory {"+'\n'+
    "    $Path = \"$Env:systemdrive\\Users\\$UserName\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\\""+'\n'+
    "    if (-not (Test-Path -Path $Path)) {"+'\n'+
    "        Write-Verbose \"[!] Could not find FireFox History for username: $UserName\""+'\n'+
    "    }"+'\n'+
    "    else {"+'\n'+
    "        $Profiles = Get-ChildItem -Path \"$Path\\*.default\\\" -ErrorAction SilentlyContinue"+'\n'+
    "        $Regex = '(http|https)://([\\w-]+\\.)+[\\w-]+(/[\\w- ./?%&=]*)*?'"+'\n'+
    "        $Value = Get-Content $Profiles\\places.sqlite | Select-String -Pattern $Regex -AllMatches |Select-Object -ExpandProperty Matches |Sort -Unique"+'\n'+
    "        $Value.Value |ForEach-Object {"+'\n'+
    "            if ($_ -match $Search) {"+'\n'+
    "                ForEach-Object {"+'\n'+
    "                New-Object -TypeName PSObject -Property @{"+'\n'+
    // "                    User = $UserName"+'\n'+ // comment out 
    // "                    Browser = 'Firefox'"+'\n'+ // 
    // "                    DataType = 'History'"+'\n'+ // 
    "                    Data = $_"+'\n'+
    "                    }    "+'\n'+
    "                }"+'\n'+
    "            }"+'\n'+
    "        }"+'\n'+
    "    }"+'\n'+
    "}"+'\n'+
    
    
    "Get-ChromeHistory | Export-Csv -Path C:\\ITAMEssential\\EventLogCSV\\BrowserData.csv -NoTypeInformation"+'\n'+
    
    "Get-FireFoxHistory | Export-Csv -Path C:\\ITAMEssential\\EventLogCSV\\BrowserData.csv -NoTypeInformation -Append"+'\n'+
    
    "Get-InternetExplorerHistory | Export-Csv -Path C:\\ITAMEssential\\EventLogCSV\\BrowserData.csv -NoTypeInformation -Append";

    const path7 = 'C:/ITAMEssential/BrowserData.ps1';
      fs.writeFile(path7, content, function (err) { 
        if (err){
          output_res['script_status'] = 'Failed';
          output_res['script_remark'] = 'Failed to perform User Behaviour Activity on this device. Failed to write bat file.';
          output_res['result_data']   = err;
          updateUserBehaviour(output_res);
          throw err;
        }else{
          console.log('Get_Browser_History Powershell Script File Created');          
          // Execute bat file part:
          child = spawn("powershell.exe",["C:\\ITAMEssential\\Get_Browser_History.bat"]);
          child.on("exit",function(){console.log("Get_Browser_History bat executed");
          // setTimeout(function(){
          //   readUBCSV("Get_Browser_History", output_res); // To upload CSV function
          //   },20000);//20 secs
          child.stdin.end(); //end input
        });
        } 
      });
  }
}




ipcMain.on('get_company_logo',function(e,form_data){  
 
 console.log(form_data);
 si.system()
    .then(systemInfo => {
      const deviceId = systemInfo.uuid;
      console.log('Device ID:', deviceId);
    
  require('dns').resolve('www.google.com', function(err) {
    if (err) {
       console.log("No connection");
    } else {
    
      session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
      .then((cookies) => {
      
        if(cookies.length > 0){
     
       
     console.log('Device ID:', deviceId);
      var body = JSON.stringify({ "funcType": 'get_company_logo', "sys_key": cookies[0].name, "deviceId": deviceId }); 
          const request = net.request({ 
              method: 'POST', 
              url: root_url+'/main.php' 
          }); 
          
          request.on('response', (response) => {
            //console.log(`STATUS: ${response.statusCode}`)
            response.on('data', (chunk) => {
              console.log(`${chunk}`);
              if (chunk) {
                let a;
                try {
                  var obj = JSON.parse(chunk);
                  console.log(obj);
                 
                  if(obj.status == 'valid'){
                    e.reply('checked_company_logo', obj.result,server_url);
                  }else if(obj.status == 'invalid'){
                    e.reply('checked_company_logo', obj.result,server_url);
                  }
                  
                } catch (e) {
                    return console.log('get_company_logo: No proper response received'); // error in the above string (in this case, yes)!
                }
               } 
            })
            response.on('end', () => {})
        })
          request.on('error', (error) => { 
              console.log(`ERROR: ${(error)}`) 
          })
          request.setHeader('Content-Type', 'application/json'); 
          request.write(body, 'utf-8'); 
          request.end();
        }
      }).catch((error) => {
        // console.log(error)            // comment out
      })
    }
  });
});
});

ipcMain.on('Patch_Management_Main',function(e,form_data,pm_type) {
 
  
    require('dns').resolve('www.google.com', function(err) {
      if (err) {
          console.log("No connection");
      } else {
        session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
        .then((cookies) => {
       
          si.system()
          .then(systemInfo => {
            const globalDeviceId = systemInfo.uuid;
            console.log('PM Device ID:', globalDeviceId);
          
          
              if(cookies.length > 0){
                
                var body = JSON.stringify({ "funcType": 'getPatchManagementList',"sys_key": cookies[0].name,"maintenance_type":pm_type,"system_device_id":globalDeviceId }); 
                const request = net.request({ 
                    method: 'POST', 
                    url: root_url+'/patch_management.php' 
                }); console.log(cookies[0].name);
              request.on('response', (response) => {
                  
                  response.on('data', (chunk) => {
                    console.log(`${chunk}`);         // comment out
                   
                    if (chunk) {
                      let a;
                      try {
                        var obj = JSON.parse(chunk);
                        if(obj.status == 'valid'){              
                          
                          const output_data = []; 
                          output_data['management_id'] = obj.result.management_id;
                          output_data['patch_management_type']   = obj.result.patch_management_type;             
                          output_data['login_user']   = obj.result.login_user;
                                
    
                          // To Powershell Scripts
                          if (obj.result.patch_management_type == 'Gap Analysis')
                          {                         
                            Patch_Management_Scripts('Last Installed Windows Update', output_data);                             
                          }                                
    
                          if (obj.result.patch_management_type == 'Gap Analysis')
                          {                            
                            Patch_Management_Scripts('Available Pending Updates', output_data);                             
                          }                                
    
                          if (chunk.includes('Quick Update')) // Including optional drivers updates
                          {                            
                            Patch_Management_Scripts('Install_All_Updates_Available', output_data);                             
                          }                                
    
                          if (chunk.includes('Install_Specific_Updates'))
                          {                            
                            Patch_Management_Scripts('Install_Specific_Updates', output_data);                             
                          }                                
    
                          if (chunk.includes('Uninstall_Updates'))
                          {                            
                            Patch_Management_Scripts('Uninstall_Updates', output_data);                             
                          }                                
                        }
                        
                      } catch (e) {
                          return console.log('getPatchManagementList: No proper response received'); // error in the above string (in this case, yes)!
                      }
                     } 
                  })
                  response.on('end', () => {});
              })
              request.on('error', (error) => { 
                  console.log(`ERROR: ${(error)}`);
              })
              request.setHeader('Content-Type', 'application/json'); 
              request.write(body, 'utf-8'); 
              request.end();
            }

    });



    });
    };
    });
})
// ------------------------Check Hardware Change Code Strat Here ------------------------------------------------------------------------
ipcMain.on('check_hardware_changes',function(e) { 
  hardwareDetails();
 });

 function hardwareDetails(called_type = '')
 {
  require('dns').resolve('www.google.com', function(err) {
    console.log('Inside Check Hardware Call');
    if (err) {
        console.log("No connection");
     } else {
       session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
       .then((cookies) => {
       if(cookies.length > 0){
         console.log("Inside Check Hardware Cookies");
         system_ip = ip.address();
         var system_ip = ip.address();
          RAM = (os.totalmem()/(1024*1024*1024)).toFixed(1)+' GB';
          const disks = nodeDiskInfo.getDiskInfoSync();
          hdd_total = 0;
          
          for (const disk of disks) {
              if(disk.filesystem == 'Local Fixed Disk'){
                hdd_total = hdd_total + disk.blocks;
              }
          }
          
          hdd_total = hdd_total/(1024*1024*1024)+' GB';
          
           si.osInfo(function(data) {
             os_release = data.kernel;
               os_bit_type = data.arch;
               os_serial = data.serial;
               os_version = data.release;
               os_name = data.distro;
               os_OEM = data.codename;
       
               os_data = os_name+' '+os_OEM+' '+os_bit_type+' '+os_version;
       
               exec('wmic path SoftwareLicensingService get OA3xOriginalProductKey', function(err, stdout, stderr) {
                 if (stderr || err ) {    
                    var product_key='';
                 }
                 else{
                   res = stdout.split('\n'); 
                   var ctr=0;
                   var product_key='';
                   res.forEach(function(line) {
                     ctr = Number(ctr)+Number(1);
                     line = line.trim();
                     var newStr = line.replace(/  +/g, ' ');
                     var parts = line.split(/  +/g);
                     if(ctr == 2){
                       product_key = parts;
                     }
                   });
                 }
                        
                      
       
                si.bios(function(data) {
                 bios_name = data.vendor;
                 bios_version = data.bios_version;
                 bios_released = data.releaseDate;
             
             
           
               si.cpu(function(data) {
                 processor_OEM = data.vendor;
                 processor_speed_ghz = data.speed;
                 processor_model = data.brand;
               
               
           
               si.system(function(data) {
                 sys_OEM = data.manufacturer;
                   sys_model = data.model;
                   device_name = os.hostname();
                   cpuCount = os.cpus().length;
                   itam_version = app.getVersion();
                       
                   
               serialNumber(function (err, value) {
             
               getAntivirus(function(antivirus_data){  
                 console.log('sys_key: '+cookies[0].name);
                 console.log('version: '+os_data); 
                 console.log('license_key: '+product_key);
                 console.log('biosname: '+bios_name);
                 console.log('sys_ip: '+system_ip);
                 console.log('serialNo: '+bios_version);
                 console.log('biosDate: '+bios_released);
                 console.log('processor: '+processor_OEM);
                 console.log('brand: '+processor_model);
                 console.log('speed: '+processor_speed_ghz);
                 console.log('make: '+sys_OEM);
                 console.log('model: '+sys_model);
                 console.log('device_name: '+device_name);
                 console.log('cpu_count: '+cpuCount);
                 console.log('itamVersion: '+ itam_version);
                 console.log('serial_num: '+value);
                 if(called_type == 'first')
                 {
                    var funcType = 'update_hardware_data';
                 }
                 else{
                  var funcType = 'get_hardware_list';
                 }
                 var body = JSON.stringify({ 'funcType' : funcType, "sys_key": cookies[0].name, 'version': os_data, "license_key": product_key, "biosname": bios_name, "biosDate": bios_released, "sys_ip": system_ip, "serialNo": bios_version, "processor": processor_OEM, "brand": processor_model, "make": sys_OEM, "model": sys_model, "device_name": device_name, "cpu_count": cpuCount, "itamVersion": itam_version, "antivirus_data": antivirus_data, "serial_num": value, "speed": processor_speed_ghz, "ram": RAM, "hdd_capacity" : hdd_total }); 
                 
                 const request = net.request({ 
                     method: 'POST', 
                     url: root_url+'/hardware_list.php' 
                 }); 
                 request.on('response', (response) => {
               // console.log(response);
                   response.on('data', (chunk) => {
                   console.log(`${chunk}`);         // comment out
                    
                         
                     })
                         response.on('end', () => {})
                     })
                     request.on('error', (error) => { 
                         console.log(`ERROR: ${(error)}`) 
                     })
                     request.setHeader('Content-Type', 'application/json'); 
                     request.write(body, 'utf-8'); 
                     request.end();
                     
             
                   });
               
               });
             });
           });
         });
       
   });
 
 });
         
     }
   });
 };
 });
}

//--------------------- Check Hardware Change Code End Here ------------------------------------------------------------------------


// ------------------------Check Software Change Code Strat Here ------------------------------------------------------------------------
ipcMain.on('check_software_changes',function(e) { 
  softwareDetails();
});

function softwareDetails()
{
  require('dns').resolve('www.google.com', function(err) {
    console.log('Inside Check Software Call');
    if (err) {
        console.log("No connection");
     } else {
       session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
       .then((cookies) => {
       if(cookies.length > 0){
         console.log("Inside Check Software Cookies");
        
         exec('Get-ItemProperty -Path "HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*", "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*", "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*" | where { $_.DisplayName -ne $null } | Select-Object DisplayName, DisplayVersion, InstallDate | Sort DisplayName',{'shell':'powershell.exe'}, (error, stdout, stderr) => {
           if (error) {
             console.error(`exec error: ${error}`);
             return;
           }
           
           var app_list = [];
           var version ="";
           var i=0;
           res = stdout.split('\n'); 
          //  console.log(res);
           version = '[';
           res.forEach(function(line) {
             i=Number(i)+Number(1);
              line = line.trim();
              //var newStr = line.replace(/  +/g, ' ');
             var parts = line.split(/  +/g);
            
              if(parts.length >= 3)
              {
                 if(parts[0] != 'DisplayName' && parts[0] != '-----------' && parts[0] != '' && parts[1] != 'DisplayVersion' && parts[2] != 'InstallDate'){
                   version += '{"name":"'+parts[0]+'","version":"'+parts[1]+'","install_date":"'+parts[2]+'"},';
                 }
               }
               else if(parts.length == 2)
               {
                //if part 1 contains . in string then it is version otherwise it is installation date
                if(parts[1].indexOf(".") !== -1)    
                {
                    version += '{"name":"'+parts[0]+'","version":"'+parts[1]+'","install_date":"--"},';
                }
                else
                {
                  var result = Math.floor(parts[1])
                //  console.log(result);
                  if(result)
                  {
                    //              
                    version += '{"name":"'+parts[0]+'","version":"--","install_date":"'+parts[1]+'"},';                               
                  }
                  else
                      version += '{"name":"'+parts[0]+'","version":"'+parts[1]+'","install_date":"--"},';
                }
               }
              
             
           });
           version += '{}]';  // console.log(version);
        // var output = JSON.stringify(version);
          // output = JSON.parse(output);
           //console.log(output);
          var output = version;
         console.log(output);
           require('dns').resolve('www.google.com', function(err) {
           if (err) {
              console.log("No connection");
           } else {
            var body = JSON.stringify({ "funcType": 'softwareList', "sys_key": cookies[0].name, "result": output }); 
             const request = net.request({ 
                 method: 'POST', 
                 url: root_url+'/asset.php' 
             }); 
             console.log("here");
             request.on('response', (response) => {
                
                 console.log(`STATUS: ${response.statusCode}`)
                //console.log(response);
                 response.on('data', (chunk) => {
                  console.log(`${chunk}`);
                 })
                 response.on('end', () => {})
                 console.log("hhh222");
             })
             request.on('error', (error) => { 
                 console.log(`ERROR: ${(error)}`) 
             })
             request.setHeader('Content-Type', 'application/json'); 
             request.write(body, 'utf-8'); 
             request.end();
           }
         });
       });
     }
   });
 };
 });
}


//--------------------- Check Software Change Code End Here ------------------------------------------------------------------------
//----------------------Code for keyboard details Start Here--------------------------------------------------------------------

ipcMain.on('check_keyboard_changes', function(e) 
{
   keyboardDetails();   
 });

 function keyboardDetails()
 {
  keyboardContent = "Get-WmiObject -Class Win32_Keyboard | Select-Object -ExpandProperty Description";
  const path1 = 'C:/ITAMEssential/keyboard_details.ps1';
  require('dns').resolve('www.google.com', function(err) {
    console.log('Inside keyboard changes Call');
     if (err) {
        console.log("No connection");
     } else {
       session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
       .then((cookies) => {
       if(cookies.length > 0){
         console.log("Inside keyboard changes Cookies");
          fs.writeFile(path1, keyboardContent, function (err) {
            if (err){
              throw err;
            }
            else
            {
                 var split_data = [];
                 console.log('Keyboard Powershell Script File Created');
                  // Execute bat file part:
                  child = spawn("powershell.exe",["C:\\ITAMEssential\\keyboard_details.ps1"]);
                  child.stdout.on("data",function(data)
                  {
                        console.log("Powershell Data: " + data);
                        split_data.push(data);
                  });
                  child.on("exit",function()
                  {
                    console.log("Keyboard Ps1 executed");
                     updateKeyboardName(split_data,cookies[0].name);
                    child.stdin.end(); //end input
                  });
           }
          });
       }
    });
  }  
  });  
 }

 function updateKeyboardName(data,sys_key){
  console.log("Inside updateKeyboardName function");
  console.log("updateKeyboardName "+data);
 
  keyboardName = data.toString('utf8'); 
 
  var finalKeyboardData = [];
  var letters = [].concat.apply([],data.map(function(v){ 
   return v.toString().split('\r\n');
  }));
  
 
  console.log("Hw");
 
  
  finalKeyboardData = letters.filter((str) => str != '' && str != ' ');
  console.log(finalKeyboardData);
  
 
  var body = JSON.stringify({ "funcType": 'updateKeyboardName',
                              "keyboard_name" : finalKeyboardData,
                              "sys_key": sys_key,                                                       
                            }); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/hardware_list.php' 
  }); 
  request.on('response', (response) => {
      // console.log(response);
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        console.log(`${chunk}`);   
         console.log(chunk);
      })
      response.on('end', () => {        
      });
  })
  request.on('error', (error) => { 
      log.info('Error while updating Keyboard Name outputs '+`${(error)}`) 
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

};
//----------------------Code for keyboard details Start Here--------------------------------------------------------------------

//----------------------Code for Mouse details Start Here--------------------------------------------------------------------
ipcMain.on('check_mouse_changes', function(e)
{
  console.log("check_mouse_changes");
  mouseDetails();
});

function mouseDetails()
{
  mouseContent = "(Get-CimInstance win32_POINTINGDEVICE | select Name).Name";
  const path1 = 'C:/ITAMEssential/mouse_details.ps1';

  require('dns').resolve('www.google.com', function(err) {
    console.log('Inside Mouse changes Call');
    if (err) {
        console.log("No connection");
     } else {
       session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
       .then((cookies) => {
       if(cookies.length > 0){
         console.log("Inside Mouse changes Cookies");
       //  SetCron(cookies[0].name); 
         console.log(cookies[0].name);
 
         fs.writeFile(path1, mouseContent, function (err) 
          {
            if (err)
            {
              throw err;
            }
            else
            {
                  var split_data = [];
                  console.log('Mouse Powershell Script File Created');
                  // Execute bat file part:
                  child = spawn("powershell.exe",["C:\\ITAMEssential\\mouse_details.ps1"]);
                  child.stdout.on("data",function(data)
                  {
                    console.log("Powershell Data: " + data);
                    split_data.push(data);
                  });
                  child.on("exit",function()
                  {
                    console.log("Mouse Ps1 executed");
                    //console.log()
                    updateMouseName(split_data,cookies[0].name);
                    child.stdin.end(); //end input
                  });                  
                
            }
          });
        }
       });
     }  
    }); 
}

function updateMouseName(data,sys_key)
{
  console.log("Inside updateMouseName function");
  console.log("Here Buffer");
  
  mouseName = data.toString('utf8'); 

  var letters = [].concat.apply([],data.map(function(v){ 
   return v.toString().split('\r\n');
  }));
  
  mouseData = mouseName.split("\r\n"); // get mouse name in array format.
  //Remove Empty string from Mouse Data
  console.log("Hw");
  finalMouseData = letters.filter((str) => str != '' && str != ' ');
  console.log(finalMouseData);
  var body = JSON.stringify({ "funcType": 'updateMouseName',
                              "mouse_name" : finalMouseData,
                              "sys_key": sys_key,                                                       
                            }); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/hardware_list.php' 
  }); 
  request.on('response', (response) => {
      // console.log(response);
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        console.log(`${chunk}`);   
        // console.log(chunk);
      })
      response.on('end', () => {        
      });
  })
  request.on('error', (error) => { 
      log.info('Error while updating Mouse Name outputs '+`${(error)}`) 
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

};

//----------------------Code for Mouse details End Here--------------------------------------------------------------------

//----------------------Code for Graphic Card details Start Here--------------------------------------------------------------------

ipcMain.on('check_graphic_card', function(e) 
{
   graphicCardDetails(); 
 });

 function graphicCardDetails()
 {
    graphicCard = "gwmi win32_VideoController | Select-Object -ExpandProperty Name";
    const path1 = 'C:/ITAMEssential/graphic_card_details.ps1';
    require('dns').resolve('www.google.com', function(err) {
      console.log('Inside Graphic Card Call');
      if (err) {
          console.log("No connection");
      } else {
        session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
        .then((cookies) => {
        if(cookies.length > 0){
          console.log("Inside Graphic Card changes Cookies");
            fs.writeFile(path1, graphicCard, function (err) {
              if (err){
                throw err;
              }
              else
              {
                  var split_data = [];
                  console.log('Graphic Card Powershell Script File Created');
                    // Execute bat file part:
                    child = spawn("powershell.exe",["C:\\ITAMEssential\\graphic_card_details.ps1"]);
                    child.stdout.on("data",function(data)
                    {
                          console.log("Powershell Data: " + data);
                          split_data.push(data);
                    });
                    child.on("exit",function()
                    {
                      console.log("Graphic Card Ps1 executed");
                      updateGraphicCard(split_data,cookies[0].name);
                      child.stdin.end(); //end input
                    });
              }
            });
        }
      });
    }  
    }); 
 }

 function updateGraphicCard(data,sys_key){
  console.log("Inside updateGraphicCard function");
  console.log("updateGraphicCard "+data);
 
  graphicCardName = data.toString('utf8'); 
 
  var finalGraphicCardData = [];
  var letters = [].concat.apply([],data.map(function(v){ 
   return v.toString().split('\r\n');
  }));
  
 
  console.log("Hw");
 
  
  finalGraphicCardData = letters.filter((str) => str != '' && str != ' ');
  console.log(finalGraphicCardData);
  
 
  var body = JSON.stringify({ "funcType": 'updateGraphicCard',
                              "graphics_card" : finalGraphicCardData,
                              "sys_key": sys_key,                                                       
                            }); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/hardware_list.php' 
  }); 
  request.on('response', (response) => {
      // console.log(response);
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        console.log(`${chunk}`);   
         console.log(chunk);
      })
      response.on('end', () => {        
      });
  })
  request.on('error', (error) => { 
      log.info('Error while updating Graphics Card Name outputs '+`${(error)}`) 
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

};
//----------------------Code for Graphic Card details Start Here--------------------------------------------------------------------

//----------------------Code for Mother Board details Start Here--------------------------------------------------------------------
ipcMain.on('check_motherboard_changes', function(e)
{
  console.log("check_motherboard_changes");
 motherboardDetails();
});

function motherboardDetails()
{
  var motherboardData = "Get-CimInstance -Class Win32_BaseBoard | ft Product, Version -HideTableHeaders";
  const path1 = 'C:/ITAMEssential/motherboard_details.ps1';

  require('dns').resolve('www.google.com', function(err) {
    console.log('Inside Motherboard changes Call');
    if (err) {
        console.log("No connection");
     } else {
       session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
       .then((cookies) => {
       if(cookies.length > 0){
         console.log("Inside Motherboard changes Cookies");
       //  SetCron(cookies[0].name); 
         console.log(cookies[0].name);
 
         fs.writeFile(path1, motherboardData, function (err) 
          {
            if (err)
            {
              throw err;
            }
            else
            {
                  var split_data = [];
                  console.log('Motherboard Powershell Script File Created');
                  // Execute bat file part:
                  child = spawn("powershell.exe",["C:\\ITAMEssential\\motherboard_details.ps1"]);
                  child.stdout.on("data",function(data)
                  {
                    console.log("Powershell Data: " + data);
                    split_data.push(data);
                  });
                  child.on("exit",function()
                  {
                    console.log("Motherboard Ps1 executed");
                    //console.log()
                    updateMotherboard(split_data,cookies[0].name);
                    child.stdin.end(); //end input
                  });                  
                
            }
          });
        }
       });
     }  
    });  
}

function updateMotherboard(data,sys_key)
{
  console.log("Inside updateMotherboard function");
  console.log("Here Buffer");

  
   motherBoard = data.toString('utf8');
 
//   var finalMotherboardData = [];
//   var letters = [].concat.apply([],data.map(function(v){ 
//    return v.toString().split('\r\n');
//   }));
  
//  //motherBoardData = motherBoard.split("\r\n"); 
//   console.log("Hw");
 
  
//   finalMotherboardData = letters.filter((str) => str != '' && str != ' ');
//   console.log(finalMotherboardData);

 line = motherBoard.trim();
//var newStr = line.replace(/  +/g, ' ');
  var parts = line.split(/  +/g);
  var product_name = parts[0];
  var product_version = parts[1];
  var product_name = product_name.replace(/(^,)|(,$)/g, "");
 
  console.log('product_name'+product_name);
  var body = JSON.stringify({ "funcType": 'updateMotherboardData',
                              "motherboard_name" : product_name,
                              "motherboard_version" : product_version,
                              "sys_key": sys_key,                                                       
                            }); 

  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/hardware_list.php' 
  }); 
  request.on('response', (response) => {
      // console.log(response);
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        console.log(`${chunk}`);   
        // console.log(chunk);
      })
      response.on('end', () => {        
      });
  })
  request.on('error', (error) => { 
      log.info('Error while updating Motherboard Name outputs '+`${(error)}`) 
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

};

//----------------------Code for Mother Board details End Here--------------------------------------------------------------------
// --------------------- Code for Monitor Details Store Start Here ------------------------------------------------
ipcMain.on('check_monitor_resolution_size_changes', function(e)
{
  console.log("monitorDetails");
  monitorDetails();
});
function monitorDetails()
{
  console.log("Inside monitorDetails function");
  
  display = electron.screen.getPrimaryDisplay();

  // Display information
  const displayInfo = {
      name: display.name || 'Name not available',
      bounds: display.bounds,
      workArea: display.workArea,
      scaleFactor: display.scaleFactor,
      refreshRate: display.refreshRate || 'Refresh rate not available',
      bitDepth: display.colorDepth,
      orientation: display.size.width > display.size.height ? 'landscape' : 'portrait' || 'Orientation not available',
      
  };
  
  const size = display.size.width+' X '+display.size.height;
  console.log(displayInfo);console.log(size);
  session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
  .then((cookies) => {
  if(cookies.length > 0){
  var body = JSON.stringify({ "funcType": 'updateMonitorDetails',
                              "displayInfo" : displayInfo,
                              "displaySize" : size,
                              "sys_key": cookies[0].name,                                                       
                            }); 
  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/hardware_list.php' 
  }); 
  request.on('response', (response) => {
      // console.log(response);
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        console.log(`${chunk}`);   
        // console.log(chunk);
      })
      response.on('end', () => {        
      });
  })
  request.on('error', (error) => { 
      log.info('Error while updating Monitor Details outputs '+`${(error)}`) 
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();
}
});

};
// --------------------- Code for Monitor Details Store End Here ------------------------------------------------

// --------------------- Code for Monitor Screen In inches Store Start Here ------------------------------------------------
ipcMain.on('check_monitor_screen_size_changes', function(e)
{
  console.log("check_monitor_screen_size_changes");
  monitorInchesScreen();
});

function monitorInchesScreen()
{
  var motherboardInch = "(Get-WmiObject -Namespace root\\wmi -Class WmiMonitorBasicDisplayParams | select @{N='size'; E={[System.Math]::Round(([System.Math]::Sqrt([System.Math]::Pow($_.MaxHorizontalImageSize, 2) + [System.Math]::Pow($_.MaxVerticalImageSize, 2))/2.54),2)} }).size";
  const path1 = 'C:/ITAMEssential/display_inches.ps1';

  require('dns').resolve('www.google.com', function(err) {
    console.log('Inside Monitor Inches Call');
     if (err) {
        console.log("No connection");
     } else {
       session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
       .then((cookies) => {
       if(cookies.length > 0){
       console.log(cookies[0].name);
 
         fs.writeFile(path1, motherboardInch, function (err) 
          {
            if (err)
            {
              throw err;
            }
            else
            {
                  var split_data = [];
                  console.log('Monitor Inches Powershell Script File Created');
                  // Execute bat file part:
                  child = spawn("powershell.exe",["C:\\ITAMEssential\\display_inches.ps1"]);
                  child.stdout.on("data",function(data)
                  {
       //             console.log('++++++++++++++++++++++++++++++++++++++++++=');
                    console.log("Powershell Data: " + data);
                    split_data.push(data);
                  });
                  child.on("exit",function()
                  {
                    console.log("Monitor Inches Ps1 executed");
                    console.log(split_data);
                    updateMonitorInches(split_data,cookies[0].name);
                    child.stdin.end(); //end input
                  });                  
                
            }
          });
        }
       });
     }  
    });  
}

function updateMonitorInches(data,sys_key)
{
  console.log("Inside updateMonitorInches function");
  console.log("Here Buffer");

  
   monitorInches = data.toString('utf8');

   var letters = [].concat.apply([],data.map(function(v){ 
    return v.toString().split('\r\n');
   }));
   
  
   console.log("Hw");
  
   
   monitorInches = letters.filter((str) => str != '' && str != ' ');
   console.log('monitorInches======'+monitorInches);
   display_inches = monitorInches+" inch";
  console.log("monitorInches"+monitorInches);
  
  var body = JSON.stringify({ "funcType": 'updateMonitorInches',
                              "display_inches" : display_inches,
                              "sys_key": sys_key,                                                       
                            }); 

  const request = net.request({ 
      method: 'POST', 
      url: root_url+'/hardware_list.php' 
  }); 
  request.on('response', (response) => {
      // console.log(response);
      //console.log(`STATUS: ${response.statusCode}`)
      response.on('data', (chunk) => {
        console.log(`${chunk}`);   
        // console.log(chunk);
      })
      response.on('end', () => {        
      });
  })
  request.on('error', (error) => { 
      log.info('Error while updating Motherboard Inches outputs '+`${(error)}`) 
  })
  request.setHeader('Content-Type', 'application/json'); 
  request.write(body, 'utf-8'); 
  request.end();

};
// --------------------- Code for Monitor Screen In inches Store End Here ------------------------------------------------
/*** Sensor bindings ***/

var server_url = "http://104.155.23.201";

var zway_ids = zway.devices;
var conf = null;
var conf_devices = { "devices": []};

try {
   conf = fs.loadJSON("afg-conf.json");
} catch (err) {
   console.log("Unable to load afg-conf.json");
}

if (conf == null) {
   conf = conf_devices;
}

var devices = conf.devices;

var change = false;
var serial_found = false;
var used = [];

for (id in zway_ids) {
   console.log("device id =", id);
   if (id == 1)
      continue;
   var name = zway_ids[id].data.givenName.value;
   console.log("name =", name);
   if (name != 'Fibaro PIR G5 (Magic Eye)')
      continue;

   serial_found = false;

   var serial = zway_ids[id].instances[0].ManufacturerSpecific.data.serialNumber.value;
   console.log("cur serial =", serial);
   if (devices.length != 0) {
      // Find the corresponding device in the json file
      for (idx in devices) {
         console.log("conf file serial =", devices[idx].serial);
         if (compareSerial(serial, devices[idx].serial)) {
            // Device found
            console.log("serials match");
            serial_found = true;
            if (!devices[idx].id || devices[idx].id != id) {
               devices[idx].id = id;
               change = true;
            } else
               console.log("No need to update afg-conf.json");
            used.push(devices[idx].id);
            break;
         }
      }
   }
   if (serial_found == false) {
      // No corresponding device found: load it from the server
      body_serial = { serial: null };
      body_serial.serial = serial;

      var req = {
         url: server_url + "/appiot/keys",
         method: "POST",
         headers: { "Content-Type": "application/json" },
         data: JSON.stringify(body_serial)
      };

      var res = http.request(req);
      if (res.status != 200) {
         console.log("Http request failed: code", res.status, res.statusText + ":", res.data);
      } else {
         var keys = JSON.parse(res.data);
         var new_device = { battery: keys.battery, counter: keys.peopleCount, id: id,
            luminescence: keys.luminescence, motion: keys.motion, serial: serial,
            temperature: keys.temperature };
         console.log("New device added: id =", new_device.id);
         devices.push(new_device);
         used.push(new_device.id);
         change = true;
      }
   }
}

// Remove unused devices
for (idx in devices) {
   var device = devices[idx];
   if (device.id) {
      var i = used.indexOf(device.id);
      if (i === -1) {
         devices.splice(idx, 1);
         used.splice(i, 1);
         change = true;
      }
   } else {
      devices.splice(idx, 1);
      change = true;
   }
}


// Save changes in the afg-conf.json file
if (change) {
  confObjectToFile(conf);
}

function confObjectToFile(obj) {
 try {
      system('sudo rm /opt/z-way-server/automation/storage/afgconfjson-*.json');
      saveObject('afg-conf.json', obj);
      var ret = system('sudo mv /opt/z-way-server/automation/storage/afgconfjson-* /opt/z-way-server/automation/afg-conf.json');
      if (ret > 0)
         console.log("System command 'mv' return error code:", ret);
      else
         console.log("Updated afg-conf.json");
   } catch (err) {
      console.log('Error updating afg-conf.json:', err);
   }
}

function compareSerial(s1, s2) {
   if (s1 == null || s2 == null)
      return false;
   if (s1.length != s2.length)
      return false;
   for (i in s1) {
      if (s1[i] !== s2[i])
         return false;
   }
   return true;
}

function saveMeasure(type, value, id, time, serial) {
   try {
      console.log("Saving measure:", type, '=', value);
      // Local save
      var ret1 = system('python /opt/z-way-server/automation/savemeasure.py', type, value, time);
      // Appiot
      var ret2 = system('python /opt/z-way-server/automation/afg-appiot.py', id, value, time);
      // Server
      var req = {
         url: server_url + "/event",
         method: "POST",
         headers: { "Content-Type": "application/json" },
         data: JSON.stringify({ serial: serial, type: type, date: time, value: value })
      };
      var res = http.request(req);
      if (ret1 > 0)
         console.log("savemeasure.py error code:", ret1);
      if (ret2 > 0)
         console.log("appiot.py error code:", ret2);
      if (res.status != 201)
         console.log("Http request failed: code", res.status, res.statusText);
   } catch (err) {
      console.log("saveMeasure call error:", err);
   }
}

console.log("Device count:", devices.length);

// Apply bindings for all devices
for (idx in devices) {
   var device = devices[idx];
   if (!device.id)
      continue;
   console.log("Create bindings for device id =", device.id)

   zway.devices[device.id].instances[0].Alarm.data[7].event.bind(function() {
      var event = zway.devices[device.id].instances[0].Alarm.data[7].event;
      if (event.value == 0) {
         var eventParam = zway.devices[device.id].instances[0].Alarm.data[7].eventParameters;
         if (eventParam.value.length > 0 && eventParam.value[0] == 8)
            // PIR = OFF
            saveMeasure('motion', 0, device.motion, eventParam.updateTime, device.serial);
      } else if (event.value == 8)
         // PIR = ON
         saveMeasure('motion', 1, device.motion, event.updateTime, device.serial);
   });

   zway.devices[device.id].instances[0].commandClasses[49].data[3].val.bind(function() {
      var val = zway.devices[device.id].instances[0].commandClasses[49].data[3].val;
      saveMeasure('luminescence', val.value, device.luminescence, val.updateTime, device.serial);
   });

   zway.devices[device.id].instances[0].commandClasses[49].data[1].val.bind(function() {
      var val = zway.devices[device.id].instances[0].commandClasses[49].data[1].val;
      saveMeasure('temperature', val.value, device.temperature, val.updateTime, device.serial);
   });

   zway.devices[device.id].instances[0].Battery.data.last.bind(function() {
      var last = zway.devices[device.id].instances[0].Battery.data.last;
      saveMeasure('battery', last.value, device.battery, last.updateTime, device.serial);
   });
}

console.log("AfgConfig.js loaded");
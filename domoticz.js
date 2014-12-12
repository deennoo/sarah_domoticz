exports.action = function(data, callback, config, SARAH){
	var config = SARAH.ConfigManager.getConfig().modules.domoticz,
	url = 'http://'+config.ip_lan+':'+config.port+'/',
	tts = "Je m'en occupe";

	switch(data.command){
		case "configScenes":
		url = url+'json.htm?type=scenes';
		call(url,function(results){
			if(results.body){
				saveJson(fileScene,results.body,function(saveResult){
					if(saveResult===true){
						tts = "Sceine enregistré !";
					}else{
						tts = "Je n'ai pas réussi à enregistrer vos sceines";
					}
					callback({"tts":tts});
				});
			}else{
				callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
			}
		},function(error){
			callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
		});
		break;
		case "configDevices":
		url = url+'json.htm?type=devices&filter=all&used=true&order=Name';
		call(url,function(results){
			if(results.body){
				var corp = JSON.parse(results.body);
				if(corp.result&&corp.result.length>0){
					putDevices(corp.result,function(stat){
						tts = (stat===true)?'Peiripheiriques enregistré !':"Je n'ai pas réussi à enregistrer vos Peiripheiriques";
						callback({"tts":tts});
					});
				}else{
					callback({"tts":"Je nai pas pus récuperer vos périphériques."});
				}
			}else{
				callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
			}
		},function(error){
			callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
		});
		break;
		case "etatLight":
		if(data.device){
			url = url+'json.htm?type=devices&rid='+data.device;
			call(url,function(results){
				if(results.body){
					var corp = JSON.parse(results.body);
					if(corp.result&&corp.result.length>0){
						if(corp.result[0].Data==="On"){
							callback({"tts":corp.result[0].Name+' est allumé.'});
						}else{
							callback({"tts":corp.result[0].Name+' est eitein.'});
						}
					}else{
						callback({"tts":"Je n'ai pas réussi à le faire."});
					}
				}else{
					callback({"tts":"Je n'ai pas réussi à le faire."});
				}
			},function(error){
				callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
			});
		}else{
			callback({"tts":"Il semble que la configuration soit invalide"});
		}
		break;
		case "actionLight":
		if(data.action&&data.device){
			url = url+'json.htm?type=command&param=switchlight&idx='+data.device+'&switchcmd='+data.action+'&level=0';
			call(url,function(results){
				if(results.body){
					var corp = JSON.parse(results.body);
					if(corp.status&&corp.status==="OK"){
						callback();
					}else{
						callback({"tts":"Je n'ai pas réussi à le faire."});
					}
				}else{
					callback({"tts":"Je n'ai pas réussi à le faire."});
				}
			},function(error){
				callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
			});
		}else{
			callback({"tts":"Il semble que la configuration soit invalide"});
		}
		break;
		case "actionSensorExt":
		if(data.action&&data.device){
			url = url+'json.htm?type=devices&rid='+data.device;
			call(url,function(results){
				if(results.body){
					var corp = JSON.parse(results.body);
					if(corp.result&&corp.result.length>0){
						corp.result = corp.result[0];
						switch(data.action){
							case 'temp':
							callback({"tts":"La tempeirature eixterieur est "+corp.result.Temp+" degrei."});
							break;
							case 'hum':
							callback({"tts":"L'humiditei eixterieur est "+corp.result.Humidity+" pourssant."});
							break;
							case 'baro':
							value = corp.result.Data.split(', ');
							value = value[2].replace('hPa','');
							callback({"tts":"la preission eixterieur est "+value+" hectoPascal."});
							break;
							case 'wind':
							var value = corp.result.Speed.replace('.',' virgule ');
							callback({"tts":"Le vent  est "+value+" meitre par seconde."});
							break;
						}
					}else{
						callback({"tts":"Je n'ai pas réussi à le faire."});
					}
				}else{
					callback({"tts":"Je n'ai pas réussi à le faire."});
				}
			},function(error){
				callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
			});
}else{
	callback({"tts":"Il semble que la configuration soit invalide"});
}
break;
case "actionSensor":
if(data.device){
	url = url+'json.htm?type=devices&rid='+data.device;
	call(url,function(results){
		if(results.body){
			var corp = JSON.parse(results.body);
			if(corp.result&&corp.result.length>0){
				corp.result = corp.result[0];
				var value = corp.result.Data;

				value = value.replace('.',' virgule ');
				tts = corp.result.Name+" est "+value;
				callback({"tts":tts});
			}else{
				callback({"tts":"Je n'ai pas réussi à le faire."});
			}
		}else{
			callback({"tts":"Je n'ai pas réussi à le faire."});
		}
	},function(error){
		callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
	});
}else{
	callback({"tts":"Il semble que la configuration soit invalide"});
}
break;
}
}

/* Constant */
var baseUrl = 'plugins/domoticz/',
fileXML = baseUrl+'domoticz.xml',
fileScene = baseUrl+'pseudoDb/scenes.json',
fileDevices = baseUrl+'pseudoDb/devices.json';

/*
* Envoie une requete vers domoticz
* @param: string
* @param: function
* @param: function
*/
var call = function (url, success, error){
	var request = require('request');
	request({ 'uri' : url }, function (err, response, body){
		if (!err && response.statusCode == 200){
			success(response);
		}else{
			error(err);
		}
	});
}

/*
* sauvegarde un json
* @param: string
* @param: string
* @param: function
*/
var saveJson = function(file,data,callback){
	var fs = require('fs');
	fs.unlink(file,function(errd){
		if(!errd){
			fs.writeFile(file, data, function(err) {
				if(err) {
					callback(false);
				} else {
					callback(true);
				}
			});
		}
	});
}

/*
* recupere le contenu d'un json
* @param: object
* @param: function
*/
var getJson = function(file,callback){
	var fs = require('fs');
	fs.readFile(file,{encoding:'utf8'},function(err,success){
		if(err){
			callback(false)
		}else{
			callback(JSON.parse(success));
		}
	}
	);
}

/*
* ajoute un device de type light au xml
* @param: object
* @param: function
*/
var putDevices = function(obj,callback){
	var fs = require('fs'),
	xml2js =require('xml2js'),
	parseString = xml2js.parseString,
	builder = new xml2js.Builder(),
	model = null,
	zoneLight = [],
	zoneSensorExt = [],
	zoneSensor = [],
	newXml = null;
	fs.readFile(fileXML,{encoding:'utf8'},function(err,success){
		if(err){
			callback(false);
		}else{
			for(var index in obj){
				var row = obj[index];
				switch(true){
					case (row.Type.indexOf('Lighting')>-1):
					if(row.Name&&row.idx){
						zoneLight.push({ _: row.Name, tag: [ 'out.action.device="'+row.idx+'";' ] });
					}
					break;
					case (row.Type.indexOf('Wind')>-1):
					zoneSensorExt.push({ _: 'le vent', tag: [ 'out.action.device="'+row.idx+'";','out.action.action="wind";' ] });
					break;
					case (row.Type.indexOf('Temp + Humidity + Baro')>-1):
					if(row.idx){
						zoneSensorExt.push({ _: 'la tempeirature', tag: [ 'out.action.device="'+row.idx+'";','out.action.action="temp";' ] });
						zoneSensorExt.push({ _: "l'humiditei", tag: [ 'out.action.device="'+row.idx+'";','out.action.action="hum";' ] });
						zoneSensorExt.push({ _: "la pression", tag: [ 'out.action.device="'+row.idx+'";','out.action.action="baro";' ] });
					}
					break;
					case (row.Type.indexOf('General')>-1):
					case (row.Type.indexOf('Temp')>-1&&row.Type.indexOf('Humidity')===-1):
					if(row.Name&&row.idx){
						zoneSensor.push({ _: row.Name, tag: [ 'out.action.device="'+row.idx+'";' ] });
					}
					break;
				}
				parseString(success, function (err, result) {
					if(!err){
						for(var index in result.grammar.rule){
							switch(true){
								case (result.grammar.rule[index].$.id==='ruleLight'):
								if(zoneLight.length>0){
									result.grammar.rule[index]['one-of'][1].item = zoneLight;
								}
								break;
								case (result.grammar.rule[index].$.id==='ruleSensorExt'):
								if(zoneSensorExt.length>0){
									result.grammar.rule[index]['one-of'][1].item = zoneSensorExt;
								}
								break;
								case (result.grammar.rule[index].$.id==='ruleSensor'):
								if(zoneSensor.length>0){
									result.grammar.rule[index]['one-of'][1].item = zoneSensor;
								}
								break;
							}
						}
						newXml = builder.buildObject(result);
						//correction saute de ligne
						newXml = newXml.replace(/\n\s\s\s\s\s\s\s\s\s/g,'');
						newXml = newXml.replace('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n','');
						saveJson(fileXML,newXml,function(data){
							callback(data);
						});

					}else{
						callback(false);
					}
				});
}
}
});
}

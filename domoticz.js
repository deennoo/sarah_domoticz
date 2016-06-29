/* Constant */
var baseUrl = 'plugins/domoticz/',
fileXML = baseUrl+'domoticz.xml',
fileScene = baseUrl+'pseudoDb/scenes.json',
fileDevices = baseUrl+'pseudoDb/devices.json',
fileHelper = require('./file_helper.js'),
domoticzHelper = require('./domoticz_helper.js');

exports.init = function(SARAH) {
	var config = Config.modules.domoticz,
	url = 'http://'+config.ip_lan+':'+config.port+'/';
	SARAH.context.domoticz = {};
	//récupération des scenes dans le context
	domoticzHelper.getScenes(url,function(data){
		switch(data){
			case 'error_no_body':
			case 'error_404':
			console.log('domoticz - récupération des scènes fail!');
			break;
			default:
			SARAH.context.domoticz.scenes = data;
			break;
		}
	});

	//récupération des devices
	domoticzHelper.getDevices(url,function(data){
		switch(data){
			case 'error_no_body':
			case 'error_404':
			console.log('domoticz - récupération des périphériques fail!');
			break;
			default:
			SARAH.context.domoticz.devices=data
			break;
		}
	});

	//récupération du sunrise
	domoticzHelper.getSunRise(url,function(data){
		switch(data){
			case 'error_no_body':
			case 'error_404':
			console.log('domoticz - récupération des périphériques fail!');
			break;
			default:
			SARAH.context.domoticz.sunrize=data
			break;
		}
	});
};

exports.action = function(data, callback, config, SARAH){
	var config = Config.modules.domoticz,
	url = 'http://'+config.ip_lan+':'+config.port+'/',
	tts = "Je m'en occupe";

	switch(data.command){
		case "configScenes":
		domoticzHelper.getScenes(url,function(data){
			switch(data){
				case 'error_no_body':
				case 'error_404':
				callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
				break;
				default:
				SARAH.context.domoticz = {
					"scenes": data
				};
				callback({"tts":"J'ai bien enregistré vos scènes"});
				break;
			}
		});
		break;
		case "configDevices":
		domoticzHelper.getDevices(url,function(data){
			switch(data){
				case 'error_no_body':
				case 'error_404':
				callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
				break;
				default:
				domoticzHelper.putDevices(data,function(stat){
					tts = (stat===true)?'Peiripheiriques enregistré !':"Je n'ai pas réussi à enregistrer vos Peiripheiriques";
					callback({"tts":tts});
				});
				SARAH.context.domoticz.devices=data
				break;
			}
		});
		break;
		case "etatLight":
		if(data.device){
			domoticzHelper.getDevice(url,data.device,function(result){
				domoticzHelper.setContextDeviceData(SARAH,data.device,result);
				switch(result){
					case 'error_no_body':
					case 'error_404':
					callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
					break;
					default:
					switch(true){
						case (result.Data.indexOf('On')>-1):
						case (result.Data.indexOf('Open')>-1):
						case (result.Data.indexOf('SetLevel')>-1):
						callback({"tts":result.Name+' est allumé.'});
						break;
						default:
						callback({"tts":result.Name+' est eitein.'});
						break;
					}
					break;
				}
			});
		}
		break;
		case "etatBlind":
		if(data.device){
			domoticzHelper.getDevice(url,data.device,function(result){
				domoticzHelper.setContextDeviceData(SARAH,data.device,result);
				switch(result){
					case 'error_no_body':
					case 'error_404':
					callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
					break;
					default:
					switch(true){
						case (result.Data.indexOf('On')>-1):
						case (result.Data.indexOf('Open')>-1):
						case (result.Data.indexOf('SetLevel')>-1):
						callback({"tts":result.Name+' est ouvert.'});
						break;
						default:
						callback({"tts":result.Name+' est fermé.'});
						break;
					}
					break;
				}
			});
		}
		break;
		case "actionLight":
		var phrase_success = new Array();
        phrase_success[1] = 'C\'est fait!';
        phrase_success[2] = 'A vos ordres!';
        phrase_success[3] = 'Commande effectuée!';
        phrase_success[4] = 'Ok!';
        phrase_success[5] = 'Bien meussieu'
		if(data.action&&data.device){
            devices = data.device.split(',');
            actionLight(SARAH,url,devices,0,data.action,callback);
		}else{
			callback({"tts":"Il semble que la configuration soit invalide"});
		}
		break;
				case "actionBlind":
		var phrase_success = new Array();
        phrase_success[1] = 'C\'est fait!';
        phrase_success[2] = 'A vos ordres!';
        phrase_success[3] = 'Commande effectuée!';
        phrase_success[4] = 'Ok!';
        phrase_success[5] = 'Bien meussieu'
		if(data.action&&data.device){
			domoticzHelper.setDevice(url,data.device,data.action,function(result){
				switch(result){
					case 'error_no_body':
					case 'error_404':
					callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
					break;
					case true:
					domoticzHelper.setContextDeviceData(SARAH,data.device,{Data:data.action});
					random = Math.floor((Math.random()*(phrase_success.length-1))+1);
                    phrase_select = phrase_success[random];
                    callback({'tts': phrase_select});
					break;
				}
			},0);
		}else{
			callback({"tts":"Il semble que la configuration soit invalide"});
		}
		break;
		case "actionSensorExt":
		if(data.action&&data.device){
			domoticzHelper.getDevice(url,data.device,function(result){
				switch(result){
					case 'error_no_body':
					case 'error_404':
					callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
					break;
					default:
					domoticzHelper.setContextDeviceData(SARAH,data.device,result);
					switch(data.action){
						case 'temp':
						callback({"tts":"La tempeirature exterieur est de "+result.Temp+" degrey."});
						break;
						case 'hum':
						callback({"tts":"L'humiditei exterieur est de "+result.Humidity+" pour cent."});
						break;
						case 'baro':
						value = result.Data.split(', ');
						value = value[2].replace('hPa','');
						callback({"tts":"la prayssion éxterrieur est de "+value+" hectoPascal."});
						break;
						case 'wind':
						var value = result.Speed.replace('.',' virgule ');
						callback({"tts":"Le vent  est "+value+" maitre par seconde."});
						break;
					}
					break;
				}
			});
		}else{
			callback({"tts":"Il semble que la configuration soit invalide"});
		}
		break;
		case "actionSensorInt":
		if(data.action&&data.device){
			domoticzHelper.getDevice(url,data.device,function(result){
				switch(result){
					case 'error_no_body':
					case 'error_404':
					callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
					break;
					default:
					domoticzHelper.setContextDeviceData(SARAH,data.device,result);
					switch(data.action){
						case 'temp':
						callback({"tts":"La tempeirature interieur est de "+result.Temp+" degrey."});
						break;
						case 'hum':
						callback({"tts":"L'humiditei interieur est de "+result.Humidity+" pour cent."});
						break;
						
					}
					break;
				}
			});
		}else{
			callback({"tts":"Il semble que la configuration soit invalide"});
		}
		break;
		case "actionSensorPis":
		if(data.action&&data.device){
			domoticzHelper.getDevice(url,data.device,function(result){
				switch(result){
					case 'error_no_body':
					case 'error_404':
					callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
					break;
					default:
					domoticzHelper.setContextDeviceData(SARAH,data.device,result);
					switch(data.action){
						case 'temp':
						callback({"tts":"La tempeirature de la piscine est de "+result.Temp+" degrey."});
						break;
						
					}
					break;
				}
			});
		}else{
			callback({"tts":"Il semble que la configuration soit invalide"});
		}
		break;
		case "actionSensor":
		if(data.device){
			domoticzHelper.getDevice(url,data.device,function(result){
				switch(result){
					case 'error_no_body':
					case 'error_404':
					callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
					break;
					default:
					domoticzHelper.setContextDeviceData(SARAH,data.device,result);
					var value = result.Data;
					value = value.replace('.',' virgule ');
					callback({"tts":result.Name+" est "+value});
					break;
				}
			});
		}else{
			callback({"tts":"Il semble que la configuration soit invalide"});
		}
		break;
		case "etatSunrise":
		if(data.action){
			domoticzHelper.getSunRise(url,function(result){
				switch(result){
					case 'error_no_body':
					case 'error_404':
					callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
					break;
					default:
					switch(data.action){
						case 'leve':
						callback({"tts":"Aujourd'hui Le soleil se léve a "+domoticzHelper.formatHours(result.Sunrise)});
						break;
						case 'couche':
						callback({"tts":"Aujourd'hui Le soleil se couchera a "+domoticzHelper.formatHours(result.Sunset)});
						break;
					}
					SARAH.context.domoticz.sunrize=result
					break;
				}
			});
		}
		break;
	}
};
function actionLight(SARAH,url,devices,index,action,callback) {
   domoticzHelper.setDevice(url,devices[index],action,function(result){
      switch(result){
         case 'error_no_body':
         case 'error_404':
            callback({"tts":"Je nai pas reussi a communiquer avec domoticz"});
         break;
         case true:
            domoticzHelper.setContextDeviceData(SARAH,devices[index],{Data:action});
            
            if (index==devices.length-1) {
                // on a fait tous les devices

               var phrase_success = new Array();
                    phrase_success[1] = 'C\'est fait!';
                    phrase_success[2] = 'A vos ordres!';
                    phrase_success[3] = 'Commande effectuée!';
                    phrase_success[4] = 'Ok!';
                    phrase_success[5] = 'Bien meussieu'

               random = Math.floor((Math.random()*(phrase_success.length-1))+1);

               
                  phrase_select = phrase_success[random];
                  callback({'tts': phrase_select});
            } else {
                // il reste encore des devices à allumer/éteindre
               actionLight(SARAH,url,devices,index+1,action,callback);
            }
         break;
      }
   },0);
}

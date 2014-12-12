/* Constant */
var baseUrl = 'plugins/domoticz/',
fileXML = baseUrl+'domoticz.xml',
fileHelper = require('./file_helper.js');

module.exports = {
	/*
	* Envoie une requete vers domoticz
	* @param: string
	* @param: function
	* @param: function
	*/
	call:function (url, success, error){
		var request = require('request');
		request({ 'uri' : url }, function (err, response, body){
			if (!err && response.statusCode == 200){
				success(response);
			}else{
				error(err);
			}
		});
	},
	/*
	* ajoute un device de type light au xml
	* @param: object
	* @param: function
	*/
	putDevices : function(obj,callback){
		var xml2js = require('xml2js'),
		parseString = xml2js.parseString,
		builder = new xml2js.Builder(),
		model = null,
		zoneLight = [],
		zoneSensorExt = [],
		zoneSensor = [],
		newXml = null;

		fileHelper.getFile(fileXML,function(success){
			if(success!==false){
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
							newXml = newXml.replace(/\n\s\s\s\s\s\s\s\s\s/g,'');
							newXml = newXml.replace('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n','');
							callback(fileHelper.setFile(fileXML,newXml));
						}else{
							callback(false);
						}
					});
}
}else{
	callback(false);
}
});
},
	/*
	* recupere les scenes
	* @param: string
	* @param: function
	*/
	getScenes:function(url,callback){
		url = url+'json.htm?type=scenes';
		this.call(url,function(results){
			if(results.body){
				var corp = JSON.parse(results.body);
				callback(corp.result);
			}else{
				callback('error_no_body');
			}
		},function(error){
			callback('error_404');
		});
	},
	/*
	* recupere  les devices
	* @param: string
	* @param: function
	*/
	getDevices:function(url,callback){
		url = url+'json.htm?type=devices&filter=all&used=true&order=Name';
		this.call(url,function(results){
			if(results.body){
				var corp = JSON.parse(results.body);
				if(corp.result&&corp.result.length>0){
					callback(corp.result);
				}else{
					callback('error_no_body');
				}
			}else{
				callback('error_404');
			}
		},function(error){
			callback('error_404');
		});
	},
	/*
	* recupere les valeurs du peripheriques
	* @param: string
	* @param: function
	*/
	getDevice:function(url,idx,callback){
		url = url+'json.htm?type=devices&rid='+idx;
		this.call(url,function(results){
			if(results.body){
				var corp = JSON.parse(results.body);
				if(corp.result&&corp.result.length>0){
					callback(corp.result[0]);
				}else{
					callback('error_no_body');
				}
			}else{
				callback('error_no_body');
			}
		},function(error){
			callback('error_404');
		});
	},
	/*
	* met à jours la valeur du peripherique dans le context
	* @param: obj
	* @param: integer
	* @param: obj
	*/
	setContextDeviceData:function(SARAH,idx,values){
		for(var index in SARAH.context.domoticz.devices){
			if(SARAH.context.domoticz.devices[index].idx==idx){
				for(var jindex in values){
					SARAH.context.domoticz.devices[index][jindex]=values[jindex];
				}
			}
		}
	},
	/*
	* change l'etat d'un device sur domoticz
	* @param: obj
	* @param: integer
	* @param: obj
	*/
	setDevice:function(url,idx,value,callback,level){
		level = (level===undefined)?'0':level;
		url = url+'json.htm?type=command&param=switchlight&idx='+idx+'&switchcmd='+value+'&level='+level;
		this.call(url,function(results){
			if(results.body){
				var corp = JSON.parse(results.body);
				if(corp.status&&corp.status==="OK"){
					callback(true);
				}else{
					callback('error_no_body');
				}
			}else{
				callback('error_no_body');
			}
		},function(error){
			callback('error_404');
		});
	},
	/*
	* recupere le sunrise
	* @param: obj
	* @param: integer
	* @param: obj
	*/
	getSunRise:function(url,callback){
		url = url+'json.htm?type=command&param=getSunRiseSet';
		this.call(url,function(results){
			if(results.body){
				var corp = JSON.parse(results.body);
				callback(corp);
			}else{
				callback('error_404');
			}
		},function(error){
			callback('error_404');
		});
	},
	/*
	* recupere le sunrise
	* @param: obj
	* @param: integer
	* @param: obj
	*/
	formatHours:function(value){
		value = value.split(':');
		return value[0]+' heure '+value[1];
	},

};
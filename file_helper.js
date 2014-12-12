module.exports = {
	/**
	* recupere le contenu d'un json
	* @param: object
	* @param: function
	*/
	getJsonFile:function(file,callback){
		var fs = require('fs');
		fs.readFile(file,{encoding:'utf8'},function(err,success){
			if(err){
				callback(false)
			}else{
				callback(JSON.parse(success));
			}
		}
		);
	},
	getFile:function(file,callback){
		var fs = require('fs');
		fs.readFile(file,{encoding:'utf8'},function(err,success){
			if(err){
				callback(false)
			}else{
				callback(success);
			}
		}
		);
	},
	setFile:function(file,data){
		var fs = require('fs');
		fs.writeFileSync(file, data);
		return true;
	}
};
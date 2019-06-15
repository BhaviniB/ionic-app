var mongoose = require('mongoose');
// all the operations of MongoDB are done through mongoose, mongoose is a library which eases the mongodb manipulation operations.
var companySchema = mongoose.Schema({
	name : String, //Name of  the Company
	placement_date : String, //Date when the company is coming for placements.
	updated : { type: Date, default: Date.now } // Creating or updating timestamp
}); 

/*
Creates a companies collection on mlab mongoDB database. Mongoose always plurarizes the collection name.
To find all the entries in Mongo database use syntax `db.companies.find()`
*/
var Companys = module.exports = mongoose.model('Company', companySchema);


/* 
Below syntax saves/registers a company in companys colletion through mongoose.
*/
module.exports.registerCompany = function(student, callback){
	Companys.create(student, callback);
}

/*
Returns/Shows the list of all the registered companies (in JSON format).
*/
module.exports.getCompanies = function(query, callback, limit){
	Companys.find(query, callback).limit(limit);
}

/*
Removes a specific company from the companys collection.
*/
module.exports.removeCompany = function(query, callback) {
	Companys.remove(query,callback);
}
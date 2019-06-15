var mongoose = require('mongoose');

var registerSchema = mongoose.Schema({
	student_Id : mongoose.Schema.Types.ObjectId,
	company_Id : mongoose.Schema.Types.ObjectId,
	updated : { type: Date, default: Date.now }
}); 


var Registrations = module.exports = mongoose.model('Registration', registerSchema);


/* 
Saves the student appearing in a placement drive into the registrations collection.
*/
module.exports.addRegistration = function(registration, callback){
	Registrations.update(registration, registration , { upsert : true, setDefaultsOnInsert: true}, callback);
}

/*
Returns/Shows all the registered students (Returns JSON -- Contains student ID as well as Company ID for which the student is appearing for.
*/
module.exports.getRegistrations = function(query, callback, limit){
	Registrations.find(query,callback).limit(limit);
}
/*
Removes a student from a placement drive for a specific company.
*/
module.exports.removeRegistration = function(query, callback){
	Registrations.remove(query,callback);
}
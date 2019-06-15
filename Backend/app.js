var express = require('express');
var bodyParser =  require('body-parser');
var mongoose = require('mongoose');
var validator = require('validator');
var errors = require('errors');
var winston = require('winston');
var app = express();
var cors = require('cors');


var HttpStatus = require('http-status-codes');
winston.add(winston.transports.File, { filename: 'LogFile.log' });


/*=============================================================================================================================== 
ALL THE ERRORS CREATED BELOW
=================================================================================================================================
*/

// If JSON string is invalid or the syntax is wrong
errors.create({
	name: 'JsonParseException',
	defaultMessage: 'Invalid JSON String',
	defaultExplanation: 'The String is not valid JSON String',
	defaultResponse: 'Verify the String'
});

// Minimum required parameters
errors.create({
	name: 'JsonDataException',
	defaultMessage: 'JSON data does not meet minimum required conditions',
	defaultExplanation: 'JSON is missing some required key fields',
	defaultResponse: 'Verify that JSON contains all required keys'
});

// If the rollnumber is not a Number (Can be excluded if the roll numbers contains characters; Ex: R100215022)
errors.create({
	name: 'InvalidRollnoException',
	defaultMessage: 'RollNumber is not a positive integer',
	defaultExplanation: 'RollNumber of student must be a positive integer',
	defaultResponse: 'Verify that rollno is positive integer'
});

// If CGPA is not a positive integer
errors.create({
	name: 'InvalidCGPAException',
	defaultMessage: 'CGPA is not a positive float',
	defaultExplanation: 'CGPA of student must be a positive float between 0 and 10',
	defaultResponse: 'Verify that CGPA is positive float within boundry'
});

// If department doesnt meet the specified array of departments
errors.create({
	name: 'InvalidDepartmentException',
	defaultMessage: 'Department is not valid',
	defaultExplanation: 'Department entered does not match any possible departments',
	defaultResponse: 'Allowed departments are ["CSE","IT","ME","CV","BBA","BCOM","EEE","ECE"]'
});

// If the ID doesnt match a valid MongoDB ID
errors.create({
	name: 'InvalidIdException',
	defaultMessage: 'Id is not valid mongoId',
	defaultExplanation: 'Id is not correct mongoId',
	defaultResponse: 'Check Id specified'
});

// If the month is not in the format of mm-dd-yy
errors.create({
	name: 'InvalidPlacementDateException',
	defaultMessage: 'Date is either invalid or has passed',
	defaultExplanation: 'Date format is wrong or is a past date',
	defaultResponse: 'Check date. Correct Format : mm-dd-yyyy'
});

// Getting in all the models and department array 
department_array = ["CSE","IT","ME","CV","BBA","BCOM","EEE","ECE"]; //List of possible departments
Students = require('./models/student');
Companies = require('./models/company');
Registrations = require('./models/registration');

// body-parser specificss
app.use(bodyParser.json())

// Connecting with MLab account through Mongoose using ID and password.
// PS: Not a secure way from a production level point of view -- Can be set into environment variables while deploying (More secure way).
mongoose.connect('mongodb://bhavini:Batra123@ds147746.mlab.com:47746/nagarro');
var db = mongoose.connection;

app.get('/', function(req,res){
	res.send('Placement API for nagarro');
}); 

// CORS - Cross Origin Resource Sharing for travelling through one route to another and also connecting with an external API without restrictions.
app.use(cors())
app.listen(process.env.OPENSHIFT_NODEJS_PORT || 5000);



/*=============================================================================================================================== 
ALL GET METHODS
=================================================================================================================================
*/


/*
Gets the list of all the registered companies
Usage (Postman) : GET at /api/companies
Returns JSON of all the companies which are registered

Optional Parameters can be provided (In header or in Params) to get specific results
id : _id of the Company
name : Name of the Company (Case-sensitive)
date : Placement date of the company
*/
app.get('/api/companies', function(req,res){
	id = req.query.id;
	name = req.query.name;
	date = req.query.date;
	var query = {};
	if(id !== undefined){
		if(!validator.isMongoId(id + '')){
			res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidIdException().toString());
			return;
		}
		query._id= id;
	}
	if(name !== undefined)
		query.name = name;
	if(date !== undefined){
		query.placement_date = date;
	}
	Companies.getCompanies(query, function(err,companies){
		if(err){
			winston.log('error',"Get (Companies) : " + err);
			throw err;
		}
		winston.log('info',companies);
		res.json(companies);
	});
});


/*
Gets the list of all the registered students
Usage (Postman) : GET at /api/students
Returns JSON of all the students which are registered

Optional Parameters can be provided (In header or in Params) to get specific results
id : _id of the student
name : Name of the student (Full name and Case-Sensitive)
department : All the students of the given department
mincgpa : All students with CPGA greater than or equal to the provided CGPA.
*/
app.get('/api/students', function(req,res){
	id = req.query.id;
	name = req.query.name;
	department = req.query.department;
	mincgpa = req.query.mincgpa;
	var query = {};
	if(id !== undefined){
		if(!validator.isMongoId(id + '')){
			res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidIdException().toString());
			return;
		} 
		query._id= id;
	}
	if(name !== undefined){
		query.name = name;
	}
	if(department !== undefined){
		if(!validator.isIn(department,department_array)){
			res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidDepartmentException().toString());
			return;
		}
		query.department = department;
	}
	if(mincgpa !== undefined){
		if(!validator.isFloat(cgpa + '',{min : 0.0 , max : 10.0})){
			res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidCGPAException().toString());
			return;
		}
		query.cgpa = { $gte: mincgpa };
	}
	Students.getStudents(query, function(err,students){
		if(err){
			winston.log('error',"Get (Students) : " + err);
			throw err;
		}
		winston.log('info',students);
		res.json(students);
	});
});



/* 
Gets the registeration list based on the query parameters
SCHEMA is as follows:

student_Id : _id of the student,
company_Id : _id of the company,
*/
app.get('/api/students/register', function(req,res){
	sid = req.query.sid;
	cid = req.query.cid;
	var query = {};
	if(sid !== undefined){
		if(!validator.isMongoId(sid + '')){
			res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidIdException().toString());
			return;
		}
		query.student_Id = sid;
	}
	if(cid !== undefined){
		if(!validator.isMongoId(cid + '')){
			res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidIdException().toString());
			return;
		}
		query.company_Id = cid;
	}
	Registrations.getRegistrations(query,function(err,registration){
		if(err){
			winston.log('error',"Get (Students Register) : " + err);
			throw err;
		}
		winston.log('info',registration);
		res.json(registration);
	});
});



/*=============================================================================================================================== 
ALL POST METHODS
=================================================================================================================================
*/

/*
Adds up a new student in the student collection.
Usage : POST a JSON object at /api/students/add
content-type:application/json
Returns JSON string of created students(Object)

SCHEMA is as folows:

name : String, //Name of the Student
department : String, //Departemnt of the Student. eg CSE, IT etc
rollno : Number, //Rollnumber of the Student
cgpa : Number, //CGPA of the Student
*/
app.post('/api/students/add', function(req, res){
	var student = req.body;
	
	if(student.hasOwnProperty("name")  
		&& student.hasOwnProperty("department")
		&& student.hasOwnProperty("rollno")
		&& student.hasOwnProperty("cgpa")){

		if(!validator.isIn(student.department.toUpperCase(), department_array)){
			res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidDepartmentException().toString());
			return;
		}

		if(!validator.isInt(student.rollno + '', { gt : 0})){
			res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidRollnoException().toString());
			return;
		}	

		if(!validator.isFloat(student.cgpa + '', {min : 0.0 , max : 10.0})){
			res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidCGPAException().toString());
			return;
		}

		Students.addStudent(student, function(err, student){
			if(err){
				winston.log('error',"Post (Students Add) : " + err);
				throw err;
			}
			winston.log('info',student);
			res.json(student);
		});
	}else{
		res.status(HttpStatus.BAD_REQUEST).send( new errors.JsonDataException().toString());
	}
});



/*
Updates student(s) based on the passed query.
Usage : POST JSON object for updates needed at /api/students/update.
	
Optional Query Parameters which can be passed to update specific details of the student
id : _id for student
name : Name of the student (Full name and Case-Sensitive)
department : All the students of the given department
mincgpa : All the students with CPGA greater than or equal to provided.
*/
app.post('/api/students/update', function(req, res){
	var student = req.body;
	id = req.query.id;
	name = req.query.name;
	department = req.query.department;
	mincgpa = req.query.mincgpa;
	var query = {};
	if(id !== undefined){
		if(validator.isMongoId(id + ''))
			query._id= id;
		else{
			res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidIdException().toString());
			return;
		}
	} 
	if(name !== undefined){
		query.name = name;
	}
	if(department !== undefined){
		if(validator.isIn(department.toUpperCase(), department_array))
			query.department = department;
		else{
			res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidDepartmentException().toString());
			return;
		}
	}
	if(mincgpa !== undefined){
		if(validator.isFloat(mincgpa + '', {min : 0.0 , max : 10.0}))
			query.cgpa = { $gte: mincgpa };
		else{
			res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidCGPAException().toString());
			return;
		}
	}

	if( student.hasOwnProperty("rollno") && !validator.isInt(student.rollno + '', { gt : 0})){
		res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidRollnoException().toString());
		return;
	}

	if( student.hasOwnProperty("department") && !validator.isIn(student.department.toUpperCase(), department_array)){
		res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidDepartmentException().toString());
		return;
	}

	if( student.hasOwnProperty("cgpa") && !validator.isFloat(student.cgpa + '', {min : 0.0 , max : 10.0})){
		res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidCGPAException().toString());
		return;
	}

	Students.updateStudents(query, student, function(err, student){
		if(err){
			winston.log('error',"Post (Students update) : " + err);
			throw err;
		}
		winston.log('info',student);
		res.json(student);
	});
});


/*
Regiters a student for a company
Usage : POST at /api/students/register with query parameters.
Returns JSON string of created object if not exists. 

Required Query Search Parameters
sid : _id for student (MongoDB ID of student -- present as _id in the students collection)
cid : _id for company (MongoDB ID of company -- present as _id in the companys collection)
*/
app.post('/api/students/register', function(req,res){
	sid = req.query.sid;
	cid = req.query.cid;
	if(!(validator.isMongoId(cid + '') && validator.isMongoId(sid + ''))){
		res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidIdException().toString());
		return;
	}
	var register = {};
	if(cid !== undefined && sid !== undefined){
		register.student_Id = sid;
		register.company_Id = cid;
		Registrations.addRegistration(register,function(err, register){
			if(err){
				winston.log('error',"Post (Students Register) : " + err);
				throw err;
			}
			winston.log('info',register);
			res.json(register);
		})
	}else{
		res.send("Invalid Query Parameters");
	}
});


/*
Registers a new company to the companys collecton.
Usage : POST a JSON object at /api/companies/register. 
content-type:application/json
Returns JSON string of created object.

SCHEMA is as follows:
name : String, //Name of the Company
placement_date : String, //Date when the company is coming for placement
*/
app.post('/api/companies/register', function(req, res){
	var company = req.body;
	console.log(company);
	if(company.hasOwnProperty("name") && company.hasOwnProperty("placement_date")){
		if(!validator.isAfter(company.placement_date)){
			res.status(HttpStatus.BAD_REQUEST).send( new errors.InvalidPlacementDateException().toString());
			return;
		}
		Companies.registerCompany(company, function(err, company){
			if(err){
				winston.log('error',"Post (Companies Register) : "+err);
				throw err;
			}
			winston.log('info',company);
			res.json(company);
		});
	}else{
		res.status(HttpStatus.BAD_REQUEST).send( new errors.JsonDataException().toString());
	}
});

/*=============================================================================================================================== 
ALL DELETE METHODS
=================================================================================================================================
*/

/*
Unregisters a student from placement base on query

Required query paramter : sid (Student Id)
Optional query paramert : cid (Compant Id)

*/
app.delete('/api/students/register', function(req, res){
	sid = req.query.sid;
	cid = req.query.cid;
	var query = {};
	if(cid !== undefined){
		if(!validator.isMongoId(cid + '')){
			res.send( new errors.InvalidIdException().toString());
			return;
		}
		query.company_Id = cid;
	}
	if(sid !== undefined){
		if(!validator.isMongoId(sid + '')){
			res.send( new errors.InvalidIdException().toString());
			return;
		}
		query.student_Id = sid;
	}
	if(sid === undefined){
		res.send("Invalid Query Parameters");
	}
	else{
		Registrations.removeRegistration(query,function(err, register){
			if(err){
				winston.log('error',"Delete (Students Register) : " + err);
				throw err;
			}
			winston.log('info',register);
			res.json(register);
		});
	}
});



/*
Unregisters a company from placement.

Required query parameter : cid (Company Id)
*/
app.delete('/api/companies/register', function(req,res){
	cid = req.query.cid;
	var query = {};
	
	if(cid !== undefined){
		if(!validator.isMongoId(cid + '')){
			res.send( new errors.InvalidIdException().toString());
			return;
		}
		query.company_Id = cid;
	}

	if(cid === undefined){
		res.send("Invalid Query Parameters");
	}
	else{
		queryC = {};
		queryC._id = cid;
		Companies.removeCompany(queryC,function(err, company){
			if(err){
				winston.log('error', "Delete (Companies Register) : " + err);
				throw err;
			}
			Registrations.removeRegistration(query,function(err, register){
				if(err){
					winston.log('error', "Delete (Companies Register) : " + err);
					throw err;
				}
				winston.log('info',register);
				winston.log('info',company);
				res.json(register + " " + company);
			}); 
		});
		

	}
});


app.delete('/api/students/remove', function(req,res){
	id = req.query.id;
	name = req.query.name;
	department = req.query.department;
	mincgpa = req.query.mincgpa;
	var query = {};
	if(id !== undefined) 
		query._id= id;
	if(name !== undefined)
		query.name = name;
	if(department !== undefined)
		query.department = department;
	if(mincgpa !== undefined)
		query.cgpa = { $gte: mincgpa };

	Students.removeStudents(query,function(err, student){
		if(err){
			winston.log('error', "Delete (Students Remove) : " + err);
			throw err;
		}
		winston.log('info',student);
		res.json(student);
	});
});
const range = require('express-range')
const compression = require('compression')
// load the cors library
const cors = require('cors');

const express = require('express')

const data = require('./zips')
const CitiesDB = require('./zipsdb')

//Load application keys
const db = CitiesDB(data);

const app = express();

// CORS to all routes
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start of workshop

// Mandatory workshop
// TODO GET /api/states
app.get('/api/states',
	(req, resp) => {	// handler

		// when the results is sent back, there are 3 things that need to be set:
		// Content-Type, status, result
		// this is done by this function

		const result = db.findAllStates();
		// set status code
		// resp is the object for the responses
		
		resp.status(200)

		// set Content-Type
		// used to be resp.set('X-generated-on',(new Date()).toDateString())
		resp.set('X-generated-on',(new Date()).toDateString())
		resp.type('application/json')
	
		// set results
		resp.json(result)

	}
)

// TODO GET /api/state/:abc  in Express, : means this is a variable
// GET /api/state/CA  eachState=CA
app.get('/api/state/:abc', 	
	(req, resp) => {
		const eachState = req.params.abc

		// Read the query string
		const limit = parseInt(req.query.limit) || 8
		const offset = parseInt(req.query.offset) || 0

		// to limit the results to the limit set
		const result = db.findCitiesByState(eachState,
			// this code {offset: offset, limit: limit} is the same as the following line
			// the following line is a shortcut when the resource name is the same as the variable
				{offset, limit})

		// set status
		resp.status(200)
		// set Content-Type
		resp.type('application/json')
		// set resultss
		resp.json(result)
		
	}

)

// TODO GET /api/city/:cityId
app.get('/api/city/:cityId',
	(req, resp) => {
		const cityId = req.params.cityId

		const result = db.countCitiesInState(cityId)

		resp.status(200)
		resp.json(result)
	}


)

// TODO POST /api/city
// Content-Type: application/x-www-form-urlencoded
app.post('/api/city',
	(req, resp) => {
		const body = req.body;
		console.info('body = ', body);

		if(!db.validateForm(body)){
			resp.status(400)
			resp.type('application/json')
			resp.json({'message': 'incomplete form'})
			return
		}

	}



)



// Optional workshop
// TODO HEAD /api/state/:state
// IMPORTANT: HEAD must be place before GET for the
// same resource. Otherwise the GET handler will be invoked

// TODO GET /state/:state/count
app.get('/state/sate/:state/count', 
	(req, resp) => {
		const state = req.params.state
		const count = db.countCitiesInState(state)

		const result = {
			state: state,
			numOfCities: count,
			timestamp: (new Date()).toDateString()
		}

	}

)

// TODO GET /api/city/:name




// End of workshop

const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3000;
app.listen(PORT, () => {
	console.info(`Application started on port ${PORT} at ${new Date()}`);
});


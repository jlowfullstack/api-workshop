const { join } = require('path');
const fs = require('fs');

// to load the library for issuing ETAG
const preconditions = require('express-preconditions')

const cors = require('cors');
const range = require('express-range')
const compression = require('compression')

const { Validator, ValidationError } = require('express-json-validator-middleware')
const OpenAPIValidator = require('express-openapi-validator').OpenApiValidator;

const schemaValidator = new Validator({ allErrors: true, verbose: true });

const express = require('express')

const data = require('./zips')
const CitiesDB = require('./zipsdb')

// to disable the etag implementation in Express
app.set('etag', false)

//Load application keys
const db = CitiesDB(data);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Start of workshop

// TODO 1/2 Load schemans
new OpenAPIValidator({
    apiSpec: join(__dirname, 'schema', 'zips.yaml')
}).install(app)
    .then(() => {
        // no error, able to proceed

        // start of content from routes from Workshop02....

        // to test if the browzer will reissue the request
        var count = 0;

        // TODO GET /api/states
        app.get('/api/states',
            (req, resp) => {	// handler

                /*
                *****
                Day 04, Workshop 04 to add a cache header
                *****
                */
                // start of *****
                count++
                console.info('in GET /api/states:', count)
               
                // when the results is sent back, there are 3 things that need to be set:
                // Content-Type, status, result
                // this is done by this function

                const result = db.findAllStates();
                // set status code
                // resp is the object for the responses

                resp.status(200)

                // set cache
                resp.set('Cache-Control', "public, max-age=300")


                // set Content-Type
                // used to be resp.set('X-generated-on',(new Date()).toDateString())
                resp.set('X-generated-on', (new Date()).toDateString())
                resp.type('application/json')

                // set results
                resp.json(result)

                
                // end of *****


            }
        )

        // function for creating ETAG
        const options = {
            stateAsync: (req) => {
                const state = req.params.state

                // default values 8 and 0
                const limit = parseInt(req.query.limit) || 8
                const offset = parseInt(req.query.offset) || 0
                return Promise.resolve({
                    // e.g.: CA_8_0
                    etag: '"${state}_${offset}_${limit}"'
                })
           
            }

        }

        // TODO GET /api/state/:abc  in Express, : means this is a variable
        // GET /api/state/CA  eachState=CA
        app.get('/api/state/:abc',
            // the check for the ETAG should be done to check if the authorization has been provided before the execution can be completed
            preconditiohns(options),

            (req, resp) => {
                const eachState = req.params.abc

                // Read the query string
                const limit = parseInt(req.query.limit) || 8
                const offset = parseInt(req.query.offset) || 0

                // to limit the results to the limit set
                const result = db.findCitiesByState(eachState,
                    // this code {offset: offset, limit: limit} is the same as the following line
                    // the following line is a shortcut when the resource name is the same as the variable
                    { offset, limit })

                // set status
                resp.status(200)
                // set Content-Type
                resp.type('application/json')

                //set ETAG
                resp.set("ETag", '"${state}_${offset}_${limit}"')
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

        /* Removed on Day 04, Workshop 04 after adding POST in zips.yaml
        // TODO POST /api/city
        // Content-Type: application/x-www-form-urlencoded
        app.post('/api/city',
            (req, resp) => {
                const body = req.body;
                console.info('body = ', body);

                if (!db.validateForm(body)) {
                    resp.status(400)
                    resp.type('application/json')
                    resp.json({ 'message': 'incomplete form' })
                    return
                }
            }

        )
        */

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
        // ......end of content from Workshop02

        app.use('/schema', express.static(join(__dirname, 'schema')));

        app.use((error, req, resp, next) => {
            if (error instanceof ValidationError) {
                console.error('Schema validation error: ', error)
                return resp.status(400).type('application/json').json({ error: error });
            }
            else if (error.status) {
                console.error('OpenAPI specification error: ', error)
                return resp.status(400).type('application/json').json({ error: error });
            }

            console.error('Error: ', error);
            resp.status(400).type('application/json').json({ error: error });
        });

        const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3000;
        app.listen(PORT, () => {
            console.info(`Application started on port ${PORT} at ${new Date()}`);
        });
    })

    .catch(error => {
        // there is an error with our yaml file
        console.error('Error: ', error);
        resp.status(400).type('application/json').json({ error: error })
    })

// Start of workshop
// TODO 2/2 Copy your routes from workshop02 here

// End of workshop

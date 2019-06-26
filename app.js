const config = require('config');
const restify = require('restify');
const jwt = require('restify-jwt-community');
const dbConn = require('dvp-dbmodels');
const corsMiddleware = require('restify-cors-middleware');
const { Secret } = require('dvp-common-lite/Authentication/Secret.js');
const { logger } = require('dvp-common-lite/LogHandler/CommonLogHandler');
const messageFormatter = require('dvp-common-lite/CommonMessageGenerator/ClientMessageJsonFormatter');
const authorization = require('dvp-common-lite/Authentication/Authorization.js');

const licenseHandler = require('./LicenseHandler');

const cors = corsMiddleware({
    allowHeaders: ['authorization']
});

const server = restify.createServer({
    name: 'LicenseServer',
    version: ['1.0.0']
});

// restify plugins
server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(jwt({ secret: Secret }));


server.post('/DVP/API/:version/License', async function (req, res, next) {

    logger.info('recieved request', req.body, req.user.tenant, req.user.company);

    try {
        if(!req.user.tenant || !req.user.company) 
            throw new Error('Invalid Company / Tenant');

        const { key, licenseObj } = licenseHandler.createKey(req.body.fsuuid, req.user.tenant, req.user.company);

        const [ userPackages, userLicenses ] = await Promise.all([
            licenseHandler.getOrgLicensePackages(req.user.tenant, req.user.company),
            licenseHandler.getUserLicenses(req.user.tenant, req.user.company)
        ]);
        
        // if user doesn't have enough license packages, throw error!        
        if(userPackages.length < userLicenses.length)
            throw new Error("User does not have license packages!");

        let result = false;
        let jsonString = {};

        let callServer = {
            Name: req.body.serverName,
            InternalMainIP: req.body.InternalMainIP,
            MainIp: req.body.MainIp
        };

        callServer = await licenseHandler.createCallServer(req.user.tenant, req.user.company, callServer);

        console.log(callServer.id);

        // res.end('ddd');
        // return false;

        result = await licenseHandler.registerNewLicense(req.user.tenant, req.user.company, callServer.id,  key, licenseObj.expire);
        
        jsonString = messageFormatter.FormatMessage(undefined, "Successfully Registered the License", false, result);
        res.end(jsonString);
        return next();
        
    } catch(e) {
        jsonString = messageFormatter.FormatMessage(e, "Failed to register license key!", false, undefined);
        res.end(jsonString);
        return next();
    };
});


server.get('/DVP/API/:version/License', async function (req, res, next) {

    logger.info('recieved request', req.body, req.user.tenant, req.user.company);

    let limit = parseInt(req.query.limit) || 10;
    let offset = (parseInt(req.query.page) - 1 ) * limit || 0;

    try {
        if(!req.user.tenant || !req.user.company) 
            throw new Error('Invalid Company / Tenant');


        const userLicenses = await licenseHandler.getUserLicenses(req.user.tenant, req.user.company, offset, limit);

        jsonString = messageFormatter.FormatMessage(undefined, "License Keys retrieved successfully!", true, userLicenses);
        logger.info('License - Successfully retrieved License keys for user - [%s] .', jsonString);
        res.end(jsonString);
        return next();
        
    } catch(e) {
        jsonString = messageFormatter.FormatMessage(e, "Failed to get license keys!", false, undefined);
        res.end(jsonString);
        return next();
    }
});


const port = config.Host.port || 3000;

server.listen(port, function () {
    logger.info('%s listening at %s', server.name, server.url);
});
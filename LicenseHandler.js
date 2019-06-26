const config = require('config');
const moment = require('moment');
const crypto = require('crypto');
const request = require('request');
const { format } = require('util');
const validator = require('validator');
const dbConn = require('dvp-dbmodels');

module.exports.createKey = (coreUID, tenant, company) => {
    let licenseObj = {
        fscoreuuid: coreUID,
        tenant: tenant,
        company: company,
        create: moment(),
        expire: moment().add(30, 'days')
    }

    let key = crypto.createCipher('aes-128-cbc', config.Services.encryptionKey);
    let licenseKey = key.update(JSON.stringify(licenseObj), 'utf8', 'hex');
    licenseKey += key.final('hex');

    return { key: licenseKey, licenseObj: licenseObj } ;
};

module.exports.getOrgLicensePackages = (tenant, company) => {

    let userServiceHost = config.Services.userServiceHost;
    userServiceHost = validator.isIP(userServiceHost) ? userServiceHost + ':' + config.Services.userServicePort : userServiceHost;

    let userServiceURL = format("http://%s/DVP/API/%s/Organisation/packages/%s/%s",  userServiceHost,  
                                                                                        config.Services.userServiceVersion, 
                                                                                        company,
                                                                                        config.Services.licensePackageType
                                                                                    );
    
    let options = {
        method: "GET",
        url: userServiceURL,
        headers: {
            'authorization': 'Bearer ' + config.Services.accessToken,
            'companyinfo': format("%s:%s", tenant, company)
        },
        json:true
    };

    return new Promise((resolve, reject) => {
        request(options, (error, result, body) => {
            if (error) {
                reject(error)
            }
        
            if(body && body.IsSuccess && body.Result){
                resolve(body.Result);
            } else {
                let message = "Invalid response from user service.";

                if(body && body.Exception && body.Exception.Message)
                    message = body.Exception.Message
                    
                reject(new Error(message))
            };
        });
    });

};

module.exports.getUserLicenses = (tenant, company, offset, limit) => {

    let filter = {
        where: [{TenantId: tenant}, {CompanyId: company}],
        order: [['createdAt', 'DESC']],
        offset: offset
    };

    if(limit) filter['limit'] = limit;

    // return a promise
    return dbConn.LicenseKey.findAll(filter);
};

module.exports.registerNewLicense = (tenant, company, callServerId, key, expireDate) => {
    
    // return a promise
    return dbConn.LicenseKey.create({
        TenantId: tenant,
        CompanyId: company,
        CallServerId: callServerId,
        LicenseKey: key,
        ExpireDate: expireDate
    });
};

module.exports.createCallServer = (tenant, company, serverParams) => {

    let callServer = {
        Name: serverParams.Name,
        Activate: true,
        CompanyId: company,
        TenantId: tenant,
        Class: 'DVP',
        Type: 'CALLSERVER',
        Category: 'PRIVATE',
        InternalMainIP: serverParams.InternalMainIP,
        MainIp: serverParams.MainIp
    };


    return dbConn.CallServer.create(callServer);
}
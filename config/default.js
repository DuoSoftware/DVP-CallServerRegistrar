module.exports = {

    "DB": {
        "Type": "postgres",
        "User": "",
        "Password": "",
        "Port": 5432,
        "Host": "",
        "Database": ""
    },

    "Redis": {
        "mode": "",//instance, cluster, sentinel
        "ip": "",
        "port": 6389,
        "user": "duo",
        "password": "",
        "sentinels": {
            "hosts": "",
            "port": 16389,
            "name": "redis-cluster"
        }

    },

    "Security": {
        "mode": "instance",//instance, cluster, sentinel
        "ip": "",
        "port": 6389,
        "user": "",
        "password": "",
        "sentinels": {
            "hosts": "",
            "port": 16389,
            "name": "redis-cluster"
        }

    },

    "Host":
    {
        "host": "127.0.0.1",
        "port": "4040",
        "version": "1.0.0.0"
    },

    "LBServer": {

        "ip": "",
        "port": "3636"

    },

    "Services": {
        "accessToken": "",
        "encryptionKey": "",
        "resourceServiceHost": "resourceservice.app.veery.cloud",
        "resourceServicePort": "8831",
        "resourceServiceVersion": "1.0.0.0",
        "userServiceHost": "127.0.0.1",
        "userServicePort": "3638",
        "userServiceVersion": "1.0.0.0",
        "licensePackageType": "LICENSE"
    }
};
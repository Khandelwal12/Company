/* Create and export configuration variables */

// container for all the environment like staging,production and so on 
const environments = {};

// staging environment 
environments.staging = {
    'port': 3000,
    'envName': 'staging',
    'hashingSecret': 'thisisASecret',
    'maxChecks' : 5
};
// production environment
environments.production = {
    'port': 5000,
    'envName': 'production',
    'hashingSecret': 'thisisalsoASecret',
    'maxChecks' : 5
};

// Determine which environment was passed as a Command line argument
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '' ;

//check that current environment is one of the above environment, if not, default to staging
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging ;

// Export the module
module.export = environmentToExport;
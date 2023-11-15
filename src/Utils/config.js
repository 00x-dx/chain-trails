const nconf = require('nconf');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Define a function to read YAML files for nconf
nconf.formats.yaml = {
    parse: (content) => yaml.load(content),
    stringify: (obj) => yaml.dump(obj)
};

// Resolve the path to the config file once, based on the root directory
const rootDir = path.resolve(__dirname, '../../');
const configPath = path.join(rootDir, 'config.yaml');

// Initialize nconf to use the following order: argv, env, and then our YAML file
nconf.argv()
    .env()
    .file({ file: configPath, format: nconf.formats.yaml });

// Export the configured nconf instance
module.exports = nconf;
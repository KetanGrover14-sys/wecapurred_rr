const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformIgnorePatterns = [
  'node_modules/(?!(react-native|@react-native|@expo|expo|@react-navigation|react-navigation)/)',
];

module.exports = config;

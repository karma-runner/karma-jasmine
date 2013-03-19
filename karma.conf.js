frameworks = ['jasmine'];

files = [
  'src/*.js',
  'test/*.js'
];

browsers = process.env.TRAVIS ? ['Firefox'] : ['Chrome'];

plugins = [
  'karma-jasmine',
  'karma-chrome-launcher',
  'karma-firefox-launcher'
];

autoWatch = true;

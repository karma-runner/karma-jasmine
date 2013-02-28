frameworks = ['jasmine'];

files = [
  'src/*.js',
  'test/*.js'
];

browsers = process.env.TRAVIS ? ['Firefox'] : ['Chrome'];

plugins = [
  'testacular-jasmine',
  'testacular-chrome-launcher',
  'testacular-firefox-launcher'
];

autoWatch = true;

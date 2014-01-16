files = [
  JASMINE,
  JASMINE_ADAPTER,
  'lib/jasmine.js',
  'src/*.js',
  'test/*.js'
];

browsers = process.env.TRAVIS ? ['Firefox'] : ['Chrome'];

autoWatch = true;

files = [
  //JASMINE,
  'lib/jasmine.js',
  //JASMINE_ADAPTER,
  'lib/adapter.js',
  'src/*.js',
  'test/*.js'
];

browsers = process.env.TRAVIS ? ['Firefox'] : ['Chrome'];

autoWatch = true;

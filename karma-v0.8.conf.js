files = [
  JASMINE,
  JASMINE_ADAPTER,
  'src/*.js',
  'test/*.js'
];

browsers = process.env.TRAVIS ? ['Firefox'] : ['Chrome'];

autoWatch = true;

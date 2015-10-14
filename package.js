Package.describe({
  name: 'simple-schema-versioning',
  version: '0.0.1',
  summary: 'Versioning tool for aldeed:simple-schema',
  git: '',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');

  api.use(['ecmascript', 'aldeed:simple-schema']);

  api.addFiles('SimpleSchemaVersioning.js');

  api.export('SimpleSchemaVersioning');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('sanjo:jasmine@0.18.0');

  api.use('simple-schema-versioning');

  api.addFiles('tests/integration/versioning-spec.js');
});

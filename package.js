Package.describe({
  name: 'simple-schema-versioning',
  version: '0.0.1',
  summary: 'Versioning tool for aldeed:simple-schema',
  git: '',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');

  // TODO PR updates for underscore official package
  api.use(['ecmascript', 'mongo', 'check', 'davidyaha:official-underscore', 'aldeed:simple-schema@1.3.3']);

  api.imply('aldeed:simple-schema');

  api.addFiles('extend-simple-schema.js');
  api.addFiles('SimpleSchemaVersioning.js');

  api.export('SimpleSchemaVersioning');
});

Package.onTest(function(api) {
  api.use(['ecmascript', 'mongo']);
  api.use('sanjo:jasmine@0.18.0');

  api.use('simple-schema-versioning');

  api.addFiles('tests/integration/versioning-spec.js');
});

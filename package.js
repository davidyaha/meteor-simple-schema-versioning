Package.describe({
  name: 'davidyaha:simple-schema-versioning',
  version: '0.0.4',
  summary: 'Versioning tool for aldeed:simple-schema',
  git: 'https://github.com/davidyaha/meteor-simple-schema-versioning.git',
  documentation: 'README.md'
});

Npm.depends({
  "objectdiff": "1.1.0"
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');

  // TODO PR updates for underscore official package
  api.use(['ecmascript', 'mongo', 'check', 'davidyaha:official-underscore@1.8.3', 'aldeed:collection2@2.8.0'], 'server');

  api.imply('aldeed:collection2', 'server');

  api.addFiles('simple-schema-versioning.js', 'server');

  api.export('SimpleSchemaVersioning', 'server');
});

Package.onTest(function(api) {
  api.use(['ecmascript', 'mongo', 'underscore']);
  api.use('sanjo:jasmine@0.18.0');

  api.use('davidyaha:simple-schema-versioning', 'server');

  api.addFiles('tests/integration/get-migration-plan-spec.js', 'server');

  // TODO rewrite those
  //api.addFiles('tests/integration/determine-version-spec.js');

  api.addFiles('tests/integration/diff-spec.js', 'server');
  api.addFiles('tests/integration/merge-object-spec.js', 'server');
});

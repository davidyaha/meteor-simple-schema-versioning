/**
 * Created by David Yahalomi on 14/10/2015.
 */
SimpleSchemaVersioning = class SimpleSchemaVersioning {
  static getMigrationPlan(baseSchema, deltaSchema) {

    // TODO Use recursive traverse instead of finding actions each type in its turn.

    var baseSchemaKeys = _.keys(baseSchema._schema);
    var deltaSchemaKeys = _.keys(deltaSchema._schema);

    var addedFields = _.difference(deltaSchemaKeys, baseSchemaKeys);
    var ret = handleAddedFields(addedFields, deltaSchema._schema);


    var removedFields = _.keys(_.pick(deltaSchema._schema, (value) => {return !!value.removed}));
    if (removedFields.length > 0) {
      var ret2 = handleRemovedFields(removedFields);
    }

    var mergeMigrationPlans2 = mergeMigrationPlans(ret, ret2);

    return mergeMigrationPlans2;
  }

  static determineVersion(schemas, collection) {
    if (!schemas instanceof Array)
      emitError('Bad Argument', 'First argument must be an array of simple schema objects.');
    if (!collection instanceof Mongo.Collection)
      emitError('Bad Argument', 'Second argument must be a mongo collection.');


    var previousSchema;
    schemas = schemas.map((schema) => {
      return previousSchema = previousSchema ?  new SimpleSchema([previousSchema, schema]) : schema;
    });

    var lastSuccessfulSchemaIndex;
    var lastSuccessfulSchemaContext;

    return collection.find().map((doc) => {
      var docId = doc._id;
      delete doc._id;

      var checkFromIndex = 0;

      if (lastSuccessfulSchemaContext &&
          lastSuccessfulSchemaContext.validate(doc)) {
        checkFromIndex = lastSuccessfulSchemaIndex;
      }

      var validIndex = undefined;
      for (var i = checkFromIndex; i < schemas.length; i++) {

        var context = schemas[i].newContext();
        var isValid = context.validate(doc);

        // TODO there is possibly an optimization to be made after finding a valid
        // schema and than finding an invalid schema. For now I have not implemented it
        // due to edge cases where you have an v1 = {field1}, v2 = {field1, field2}, v3 = {field1, field2 (optional)}
        if (isValid) {
          validIndex = i;

          // Optimization that relies on the assumption that most of the documents will
          // match to the highest valid version found
          // TODO Think if this assumption is mostly true
          if (validIndex < lastSuccessfulSchemaIndex) {
            lastSuccessfulSchemaContext = context;
            lastSuccessfulSchemaIndex = validIndex;
          }
        }
      }

      return {_id: docId, validSchemaVersion: validIndex}
    });
  }
};

function handleAddedFields(fields, deltaSchema) {
  return fields
    .reduce(
    (migrationPlan, currentField) => {
      if (!deltaSchema[currentField])
        emitError('Cannot find field', 'Cannot find field in delta schema. This is probably a bug so make sure to report it.');
      else if (!deltaSchema[currentField].defaultValue && !deltaSchema[currentField].renamed)
        emitError('Cannot determine value', 'The added field \'' + currentField + '\' does not have a default value');
      else {
        // Up migration update arguments
        var upSelector = migrationPlan.up[0];
        var upModifier = migrationPlan.up[1];

        // Down migration update arguments
        var downSelector = migrationPlan.down[0];
        var downModifier = migrationPlan.down[1];

        // Backup query arguments
        var backupSelector = migrationPlan.backup[0];
        var backupProjection = migrationPlan.backup[1];

        downSelector.$or.push({[currentField]: {$exists: true}});

        if (!!deltaSchema[currentField].renamed) {
          if (!upModifier.$rename) upModifier.$rename = {};
          if (!downModifier.$rename) downModifier.$rename = {};

          upSelector.$or.push({[deltaSchema[currentField].renamed]: {$exists: true}});
          upModifier.$rename[deltaSchema[currentField].renamed] = currentField;

          downModifier.$rename[currentField] = deltaSchema[currentField].renamed;

          backupSelector.$or.push({[deltaSchema[currentField].renamed]: {$exists: true}});
          backupProjection.fields[deltaSchema[currentField].renamed] = 1;
        } else {
          upSelector.$or.push({[currentField]: {$exists: false}});
          upModifier.$set[currentField] = deltaSchema[currentField].defaultValue;

          downModifier.$unset[currentField] = '';

          backupSelector.$or.push({[currentField]: {$exists: true}});
          backupProjection.fields[currentField] = 1;
        }
      }

      return migrationPlan;
    },
    // initial migration plan
    {up: [{$or: []}, {$set: {}}], down: [{$or: []}, {$unset: {}}], backup: [{$or: []}, {fields: {}}]}
  );
}

function handleRemovedFields(fields) {
  return fields
    .reduce(
    (migrationPlan, currentField) => {
      var upSelector = migrationPlan.up[0];
      var upModifier = migrationPlan.up[1];

      // Up migration update arguments
      upSelector.$or.push({[currentField]: {$exists: true}});
      upModifier.$unset[currentField] = '';

      // Down migration update arguments
      var downSelector = migrationPlan.down[0];
      var downModifier = migrationPlan.down[1];

      downSelector._id = 'backedUpIds';
      downModifier.$set[currentField] = 'backedUpValue';

      // Backup query arguments
      var backupSelector = migrationPlan.backup[0];
      var backupProjection = migrationPlan.backup[1];

      backupSelector.$or.push({[currentField]: {$exists: true}});
      backupProjection.fields[currentField] = 1;

      return migrationPlan;
    },
    // initial migration plan
    {up: [{$or: []}, {$unset: {}}], down: [{$or: []}, {$set: {}}], backup: [{$or: []}, {fields: {}}]}
  );
}

function mergeMigrationPlans() {
  // TODO remove empty modifiers and selectors

  var args = Array.prototype.slice.apply(arguments);
  return args.reduce(
    (migrationPlan, currentMigrationPlan) => {

      if (!!currentMigrationPlan) {
        if (!!currentMigrationPlan.up && currentMigrationPlan.up.length === 2) {
          // Up migration update arguments
          _.extend(migrationPlan.up[0], currentMigrationPlan.up[0]);
          _.extend(migrationPlan.up[1], currentMigrationPlan.up[1]);
        }

        if (!!currentMigrationPlan.down && currentMigrationPlan.down.length === 2) {
          // Down migration update arguments
          _.extend(migrationPlan.down[0], currentMigrationPlan.down[0]);
          _.extend(migrationPlan.down[1], currentMigrationPlan.down[1]);
        }

        if (!!currentMigrationPlan.backup && currentMigrationPlan.backup.length === 2) {
          // Backup query arguments
          _.extend(migrationPlan.backup[0], currentMigrationPlan.backup[0]);
          _.extend(migrationPlan.backup[1], currentMigrationPlan.backup[1]);
        }
      }

      return migrationPlan;
    },
    // initial migration plan
    {up: [{}, {}], down: [{}, {}], backup: [{}, {}]}
  )
}

function emitError(desc, details) {
  // TODO add config check about throwing errors
  throw new Meteor.Error(500, desc, details);
}

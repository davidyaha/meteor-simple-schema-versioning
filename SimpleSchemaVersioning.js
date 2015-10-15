// Write your package code here!

SimpleSchemaVersioning = class SimpleSchemaVersioning {
  static getMigrationPlan(baseSchema, deltaSchema) {

    var baseSchemaKeys = _.keys(baseSchema._schema);
    var deltaSchemaKeys = _.keys(deltaSchema._schema);

    var addedFields = _.difference(deltaSchemaKeys, baseSchemaKeys);

    var ret = handleAddedFields(addedFields, deltaSchema._schema);

    return ret;
  }


};

function handleAddedFields(fields, deltaSchema) {
  return fields
    .reduce(
    (migrationPlan, nextField) => {
      if (!deltaSchema[nextField])
        emitError('Cannot find field', 'Cannot find field in delta schema. This is probably a bug so make sure to report it.');
      else if (!deltaSchema[nextField].defaultValue)
        emitError('Cannot determine value', 'The added field \'' + nextField + '\' does not have a default value');

      // Up migration update arguments
      var upSelector = migrationPlan.up[0];
      var upModifier = migrationPlan.up[1];

      upSelector.$or.push({[nextField]: {$exists: false}});
      upModifier.$set[nextField] = deltaSchema[nextField].defaultValue;

      // Down migration update arguments
      var downSelector = migrationPlan.down[0];
      var downModifier = migrationPlan.down[1];

      downSelector.$or.push({[nextField]: {$exists: true}});
      downModifier.$unset[nextField] = '';

      // Backup migration update arguments
      var backupSelector = migrationPlan.backup[0];
      var backupProjection = migrationPlan.backup[1];

      backupSelector.$or.push({[nextField]: {$exists: true}});
      backupProjection.fields[nextField] = 1;

      return migrationPlan;
    },
    // initial migration plan
    {up: [{$or: []}, {$set: {}}], down: [{$or: []}, {$unset: {}}], backup: [{$or: []}, {fields: {}}]}
  );
}

function emitError(desc, details) {
  // TODO add config check about trowing errors
  throw new Meteor.Error(500, desc, details);
}

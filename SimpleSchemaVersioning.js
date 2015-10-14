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
  var up = fields
    .map(
    (field) => {
      if (!deltaSchema[field])
        emitError('Cannot find field', 'Cannot find field in delta schema. This is probably a bug so make sure to report it.');
      else if (!deltaSchema[field].defaultValue)
        emitError('Cannot determine value', 'The added field \'' + field + '\' does not have a default value');

      return {$set: {[field]: deltaSchema[field].defaultValue}};
    }).reduce(
    (previousField, currentField) => {
      return {$set: _.extend(previousField.$set, currentField.$set)};
    }, {$set: {}});

  var down = {};
  var backupQuery = {};

  return {up: up, down: down, backup: backupQuery};
}

function emitError(desc, details) {
  // TODO add config check about trowing errors
  throw new Meteor.Error(500, desc, details);
}

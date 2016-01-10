/**
 * Created by David Yahalomi on 14/10/2015.
 */
const objectdiff = Npm.require('objectdiff');

SimpleSchemaVersioning = class SimpleSchemaVersioning {
  static getMigrationPlan(firstSchema, secondSchema) {

    let diff = SimpleSchemaVersioning.diff(firstSchema, secondSchema);

    if (diff) {
      return traverseDiff(diff);
    }
  }

  static diff(firstSchema, secondSchema) {
    if (arguments.length != 2 || typeof firstSchema !== 'object' || typeof secondSchema !== 'object')
      emitError('Bad arguments', 'diff must be called with two simple schema objects or plain schema objects');

    let args = _.map(arguments, normalizeSchema);

    let beforeClean = objectdiff.diff.apply(objectdiff, args);

    return cleanDiff(beforeClean);
  }

  static determineVersion(schemas, collection) {
    if (!schemas instanceof Array)
      emitError('Bad Argument', 'First argument must be an array of simple schema objects.');
    if (!collection instanceof Mongo.Collection)
      emitError('Bad Argument', 'Second argument must be a mongo collection.');

    var previousSchema;
    schemas = schemas.map((schema) => {
      return previousSchema = previousSchema ? new SimpleSchema([previousSchema, schema]) : schema;
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

function traverseDiff(diff, level = 0, trail = []) {
  var actions = {
    update: [{$or: []}, {$set: {}, $unset: {}}],
    remove: [{$or: []}],
    find: [{$or: []}, {fields: {}}]
  };

  if (diff['changed'] === 'object change') {
    _.each(diff['value'], (innerDiff, fieldName) => {
      let innerMigrations = traverseDiff(innerDiff, level + 1, [...trail, fieldName]);
      actions = mergeMigrationPlans(actions, innerMigrations);
    })
  }

  else if (diff['changed'] === 'added') {
    if (level === 1)
      callHandler(handleAddedField);
    else
      callHandler(handleAddedRestriction);
  }

  else if (diff['changed'] === 'removed') {
    if (level === 1)
      callHandler(handleRemovedField);
    else
      callHandler(handleRemovedRestriction);
  }

  else if (diff['changed'] === 'primitive change') {
    if (level === 1)
      emitError('The impossible has happened', 'There is probably some bug with this package because this should not happen...');
    else
      handleChangedRestriction(trail, diff['removed'], diff['added'], actions)
  }

  return actions;

  ///////////////////

  function callHandler(handler) {
    handler(trail, diff['value'], actions)
  }

}

function handleAddedField([fieldName], field, actions) {
  let [upSelector, upModifier] = actions.update;
  let [backupSelector, backupProjection] = actions.find;

  if (!field || !field.defaultValue)
    emitError('Cannot determine value', `The added field '${fieldName}' does not have a default value`, actions);
  else {
    upSelector.$or.push({[fieldName]: {$exists: false}});
    upModifier.$set[fieldName] = field.defaultValue;

    backupSelector.$or.push({[fieldName]: {$exists: false}});
    backupProjection.fields[fieldName] = 0;
  }
}

function handleRemovedField([fieldName], field, actions) {
  let [upSelector, upModifier] = actions.update;
  let [backupSelector, backupProjection] = actions.find;

  // Up migration update arguments
  upSelector.$or.push({[fieldName]: {$exists: true}});
  upModifier.$unset[fieldName] = '';

  backupSelector.$or.push({[fieldName]: {$exists: true}});
  backupProjection.fields[fieldName] = 1;
}

function handleAddedRestriction(trail, restriction, actions) {
  let [upSelector, upModifier] = actions.update;
  let [backupSelector, backupProjection] = actions.find;

  // TODO handle all schema properties

  // TODO handle optional true removal

  // TODO handle addition of min/max/count/exclusive restriction

  // TODO handle turn on of decimal flag

  // TODO handle addition of regex -- There is a bug on the objectDiff lib that does not recognise regex changes

  // TODO handle addition of unique flag
}

function handleRemovedRestriction(trail, restriction, actions) {
  let [upSelector, upModifier] = actions.update;
  let [backupSelector, backupProjection] = actions.find;

  // TODO handle all schema properties

  // TODO handle optional true removal
  if (restriction["optional"]) {

  }

  // TODO handle turn off trim

  // TODO handle removed index
}

function handleChangedRestriction(trail, fromValue, toValue, actions) {
  let [upSelector, upModifier] = actions.update;
  let [backupSelector, backupProjection] = actions.find;

  // TODO handle all schema properties

  // TODO handle type casts

  // TODO handle optional change

  // TODO handle change of min/max/count/exclusive restriction

  // TODO handle turn on of decimal flag

  // TODO handle rebuild index
}

function mergeMigrationPlans() {
  // TODO remove empty modifiers and selectors

  let args = Array.prototype.slice.apply(arguments);
  return args.reduce(
    (migrationPlan, currentMigrationPlan) => {

      if (!!currentMigrationPlan) {
        if (!!currentMigrationPlan.update && currentMigrationPlan.update.length === 2) {
          _.extend(migrationPlan.update[0], currentMigrationPlan.update[0]);
          _.extend(migrationPlan.update[1], currentMigrationPlan.update[1]);
        }

        if (!!currentMigrationPlan.remove && currentMigrationPlan.remove.length === 2) {
          _.extend(migrationPlan.remove[0], currentMigrationPlan.remove[0]);
          _.extend(migrationPlan.remove[1], currentMigrationPlan.remove[1]);
        }

        if (!!currentMigrationPlan.find && currentMigrationPlan.find.length === 2) {
          _.extend(migrationPlan.find[0], currentMigrationPlan.find[0]);
          _.extend(migrationPlan.find[1], currentMigrationPlan.find[1]);
        }

        if (!!currentMigrationPlan.errors) {
          migrationPlan.errors.push(...currentMigrationPlan.errors);
        }
      }

      return migrationPlan;
    },
    // initial migration plan
    {update: [{}, {}], remove: [{}, {}], find: [{}, {}], errors: []}
  )
}

function emitError(desc, details, actions) {
  let error = new Meteor.Error(500, desc, details);

  if (actions) {
    if (!actions.errors) actions.errors = [];
    actions.errors.push(error);
  } else {
    throw error;
  }
}

function unwrapSS(simpleSchema) {
  return simpleSchema && simpleSchema._schema ? simpleSchema._schema : simpleSchema;
}

function normalizeSchema(schema) {
  schema = unwrapSS(schema);

  return _.each(schema, (propertyValue, key) => {
    let normalizedValue = propertyValue;

    if (typeof propertyValue == 'function')
      normalizedValue = propertyValue.name;
    else if (typeof propertyValue == 'object')
      normalizedValue = normalizeSchema(propertyValue);

    schema[key] = normalizedValue;
  });
}

function cleanDiff(diff) {
  if (typeof diff === 'object') {
    if (diff['changed'] === 'equal')
      return undefined;

    return _.each(diff, (val, key) => {
      if (typeof val === 'object') {
        if (val['changed'] === 'equal') delete diff[key];
        else diff[key] = cleanDiff(val);
      }
    });
  }
}
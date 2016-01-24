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

  static mergeObject(first, second) {
    return mergeObject(first, second);
  }
};

function traverseDiff(diff, level = 0, trail = []) {
  var actions = {};

  if (diff['changed'] === 'object change') {
    _.each(diff['value'], (innerDiff, fieldName) => {
      let innerMigrations = traverseDiff(innerDiff, level + 1, [...trail, fieldName]);
      mergeMigrationPlans(actions, innerMigrations);
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

  if (!field || (_.isUndefined(field.defaultValue) && !field.optional))
    emitError('Cannot determine value', `The added field '${fieldName}' does not have a default value and is not optional`, actions);
  else if (_.isUndefined(field.defaultValue) && field.optional !== true) {
    emitError('Cannot determine value', `The added field '${fieldName}' does not have a default value and optional` +
      'cannot be resolved because it is a contextual function', actions);
  } else if (!_.isUndefined(field.defaultValue)) {
    if (_.isUndefined(actions.update)) actions.update = [{}, {}];
    if (_.isUndefined(actions.find)) actions.find = [{}, {}];

    mergeObject(actions.update[0], {$or: []});
    mergeObject(actions.update[1], {$set: {}});
    mergeObject(actions.find[0], {$or: []});
    mergeObject(actions.find[1], {fields: {}});

    let [upSelector, upModifier] = actions.update;
    let [backupSelector, backupProjection] = actions.find;

    upSelector.$or.push({[fieldName]: {$exists: false}});
    upModifier.$set[fieldName] = field.defaultValue;

    backupSelector.$or.push({[fieldName]: {$exists: false}});
    backupProjection.fields[fieldName] = 0;
  }
}

function handleRemovedField([fieldName], field, actions) {
  if (_.isUndefined(actions.update)) actions.update = [{}, {}];
  if (_.isUndefined(actions.find)) actions.find = [{}, {}];

  mergeObject(actions.update[0], {$or: []});
  mergeObject(actions.update[1], {$unset: {}});
  mergeObject(actions.find[0], {$or: []});
  mergeObject(actions.find[1], {fields: {}});

  let [upSelector, upModifier] = actions.update;
  let [backupSelector, backupProjection] = actions.find;

  // Up migration update arguments
  upSelector.$or.push({[fieldName]: {$exists: true}});
  upModifier.$unset[fieldName] = '';

  backupSelector.$or.push({[fieldName]: {$exists: true}});
  backupProjection.fields[fieldName] = 1;
}

function handleAddedRestriction([fieldName, ...trail], restrictionValue, actions) {
  let restrictionType = _.last(trail);

  // handle optional false addition
  if (restrictionType === 'optional' && restrictionValue === false )
    emitError('Non optional field', `Field '${fieldName}' is no longer optional`, actions);

  // handle addition of min/max/count/exclusive restriction
  else if (_.indexOf(['min', 'max', 'minCount', 'maxCount', 'minExclusive', 'maxExclusive'], restrictionType) !== -1)
    emitError('Values may not match', `Field '${fieldName}' has new restriction '${restrictionType}' with value '${restrictionValue}'`, actions);

  // handle addition of regex
  else if (restrictionType === 'regEx')
    emitError('Values may not match', `Field '${fieldName}' has new regular expression restriction`, actions);

  // handle addition of unique flag
  else if (restrictionType === 'unique' && restrictionValue === true )
    emitError('May hold duplicates',  `Field '${fieldName}' was turned unique, some of the collection values may be duplicates`, actions);

  // handle addition to allowed values
  else if (restrictionType === 'allowedValues')
    emitError('Allowed Values Added', `Field '${fieldName}' has allowedValues restriction added`, actions);
}

function handleRemovedRestriction([fieldName, ...trail], restrictionValue, actions) {
  let restrictionType = _.last(trail);

  // handle optional true removal
  if (restrictionType === 'optional' && restrictionValue)
    emitError('Non optional field', `Field '${fieldName}' is no longer optional`, actions);

  // handle turn off of decimal flag
  else if (restrictionType === 'decimal' && restrictionValue)
    emitError('Changed to non decimal', `Field '${fieldName}' does not support decimal any longer`, actions);

  // handle turn on trim
  else if (restrictionType === 'trim' && restrictionValue === false)
    emitError('Trim turned on', `Field '${fieldName}' will trim leading and trailing spaces`, actions);

  // handle removed index
  else if (restrictionType === 'index')
    emitError('Index was removed', `Index was removed from field '${fieldName}'`, actions);

  // handle addition to allowed values
  else if (restrictionType !== 'allowedValues' && _.indexOf(trail, 'allowedValues') !== -1)
    emitError('Allowed Values Changed', `Field '${fieldName}' allowedValues restriction have changed`, actions);
}

function handleChangedRestriction([fieldName, ...trail], fromValue, toValue, actions) {
  let restrictionType = _.last(trail);

  // handle type casts
  if (restrictionType === 'type')
    emitError('Type Cast Needed', `Field '${fieldName}' has changed types from '${fromValue}' to '${toValue}'`, actions);

  // handle optional change
  else if (restrictionType === 'optinal' && toValue === false)
    emitError('Non optional field', `Field '${fieldName}' is no longer optional`, actions);

  // handle change of min/max/count/exclusive restriction
  else if (_.indexOf(['min', 'max', 'minCount', 'maxCount', 'minExclusive', 'maxExclusive'], restrictionType) !== -1)
    emitError('Values may not match', `Field '${fieldName}' has changed restriction '${restrictionType}' with value '${toValue}'`, actions);

  // handle turn off of decimal flag
  else if (restrictionType === 'decimal' && toValue === false)
    emitError('Changed to non decimal', `Field '${fieldName}' does not support decimal any longer`, actions);

  // handle addition to allowed values
  else if (restrictionType !== 'allowedValues' && _.indexOf(trail, 'allowedValues') !== -1)
    emitError('Allowed Values Changed', `Field '${fieldName}' allowedValues restriction have changed`, actions);
}

function mergeMigrationPlans(firstPlan, secondPlan) {
  if (_.isUndefined(firstPlan)) {
    return secondPlan;
  }

  if (firstPlan.update || secondPlan.update) {
    let [firstUpdateSelector, firstUpdateModifier] = firstPlan.update || [{}, {}];
    let [secondUpdateSelector, secondUpdateModifier] = secondPlan.update || [{}, {}];

    mergeObject(firstUpdateSelector, secondUpdateSelector);
    mergeObject(firstUpdateModifier, secondUpdateModifier);

    firstPlan.update = [firstUpdateSelector, firstUpdateModifier];
  }

  if (firstPlan.remove || secondPlan.remove) {
    let [firstRemoveSelector, firstRemoveModifier] = firstPlan.remove || [{}, {}];
    let [secondRemoveeSelector, secondRemoveModifier] = secondPlan.remove || [{}, {}];

    mergeObject(firstRemoveSelector, secondRemoveeSelector);
    mergeObject(firstRemoveModifier, secondRemoveModifier);

    firstPlan.remove = [firstRemoveSelector, firstRemoveModifier];
  }

  if (firstPlan.find || secondPlan.find) {
    let [firstFindSelector, firstFindProjection] = firstPlan.find || [{}, {}];
    let [secondFindSelector, secondFindProjection] = secondPlan.find || [{}, {}];

    mergeObject(firstFindSelector, secondFindSelector);
    mergeObject(firstFindProjection, secondFindProjection);

    firstPlan.find = [firstFindSelector, firstFindProjection];
  }

  if (firstPlan.errors || secondPlan.errors)
    firstPlan.errors = _.union(firstPlan.errors, secondPlan.errors);

  return firstPlan;
}

function mergeObject(first, second) {
  _.each(second, (secondVal, key) => {
    let firstVal = first[key];

    if (!_.isUndefined(firstVal)) {
      if (_.isArray(firstVal)) {
        return first[key] = _.union(firstVal, secondVal);
      } else if (_.isObject(firstVal)) {
        return first[key] = mergeObject(firstVal, secondVal);
      }
    }

    first[key] = secondVal;
  });

  return first;
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
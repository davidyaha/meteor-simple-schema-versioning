#Simple Schema Versioning

## API

- Get migration plan - Call with two schemas and get an object with update, remove and find arguments 

### Example

Calling getMigrationPlan with these two schemas

```
var AddressSchema = new SimpleSchema({
  street: {
    type: String,
    max: 100
  }
});

var AddressSchemaV2 = new SimpleSchema({
  street: {
    type: String,
    max: 100
  },
  city: {
    type: String,
    max: 50,
    defaultValue: "New York"
  }
});

var actions = SimpleSchemaVersioning.getMigrationPlan(AddressSchema, AddressSchemaV2);
```
Will return
{
    update: [{$or: [{city: {$exists: false}}]}, {$set: {city: "New York"}}],
    remove: [{$or: []}] // Running this could potentially remove all documents from collection
    find: [{$or: [{city: {$exists: false}}]}, {fields: {city: 0}}]
}

So you could really just run these to migrate

```
var collection = Mongo.Collection('addresses')
_.each(actions, (args, action) => collection[action].call(collection, args));

```

- Determine version - Give array of schema objects and a collection and get a list of object ids with its version tag.
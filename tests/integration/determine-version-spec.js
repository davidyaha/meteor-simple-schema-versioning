/**
 * Created by David Yahalomi on 22/12/2015.
 */

describe('SimpleSchemaVersioning', function () {

  describe('determineVersion', function () {
    it('should take an array of schemas and return a collection that is made of object ids and the latest schema ' +
      'index number that matches the object', function () {

      var collection = new Mongo.Collection(null);

      var AddressSchema = new SimpleSchema({
        street: {
          type: String,
          max: 100
        },
        city: {
          type: String,
          max: 50
        },
        state: {
          type: String,
          regEx: /^A[LKSZRAEP]|C[AOT]|D[EC]|F[LM]|G[AU]|HI|I[ADLN]|K[SY]|LA|M[ADEHINOPST]|N[CDEHJMVY]|O[HKR]|P[ARW]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY]$/
        },
        zip: {
          type: String,
          regEx: /^[0-9]{5}$/
        }
      });

      var AddressSchemaV2 = new SimpleSchema({
        country: {
          type: String
        },
        state: {
          optional: true
        }
      });

      var AddressSchemaV3 = new SimpleSchema({
        country: {
          type: String,
          optional: true
        },
        floor: {
          type: Number
        }
      });

      var id1 = collection.insert({
        street: 'Sesame',
        city: 'Volendam',
        state: 'AL',
        zip: '67676'
      });

      var id2 = collection.insert({
        street: 'Sesame',
        city: 'Volendam',
        country: 'Holland',
        zip: '67676'
      });

      var id3 = collection.insert({
        street: 'Sesame',
        city: 'Volendam',
        zip: '67676',
        floor: 1
      });

      var actual = SimpleSchemaVersioning.determineVersion([AddressSchema, AddressSchemaV2, AddressSchemaV3], collection);

      expect(actual).toEqual([
        {
          _id: id1,
          validSchemaVersion: 0
        },
        {
          _id: id2,
          validSchemaVersion: 1
        },
        {
          _id: id3,
          validSchemaVersion: 2
        }
      ]);
    });
  });

});
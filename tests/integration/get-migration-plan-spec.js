/**
 * Created by David Yahalomi on 01/01/2016.
 */

describe('SimpleSchemaVersioning', function () {

  describe('getMigrationPlan', function () {

    describe('add fields', function () {

      it('should take base schema and changed schema with an added field ' +
        'and return update, remove and find arguments', function () {
        let AddressSchema = new SimpleSchema({
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

        let AddressSchemaV2 = new SimpleSchema({
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
          },
          floor: {
            type: Number,
            max: 100,
            min: 0,
            defaultValue: 1
          },
          apartmentNumber: {
            type: Number,
            max: 999,
            min: 1,
            defaultValue: 1
          }
        });

        let ret = SimpleSchemaVersioning.getMigrationPlan(AddressSchema, AddressSchemaV2);

        let expected = {
          "update": [{"$or": [{"floor": {"$exists": false}}, {"apartmentNumber": {"$exists": false}}]}, {
            "$set": {
              "floor": 1,
              "apartmentNumber": 1
            }
          }],
          "find": [{"$or": [{"floor": {"$exists": false}}, {"apartmentNumber": {"$exists": false}}]}, {
            "fields": {
              "floor": 0,
              "apartmentNumber": 0
            }
          }]
        };

        expect(ret).toEqual(expected);

      });

      it('should take base schema and changed schema with an added field ' +
        'with no defaultValue and return errors array', function () {
        let AddressSchema = new SimpleSchema({
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

        let AddressSchemaV2 = new SimpleSchema({
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
          },
          floor: {
            type: Number,
            max: 100,
            min: 0
          },
          apartmentNumber: {
            type: Number,
            max: 999,
            min: 1
          }
        });

        let ret = SimpleSchemaVersioning.getMigrationPlan(AddressSchema, AddressSchemaV2);

        let expected = {
          "errors": [
            new Meteor.Error(500, "Cannot determine value", "The added field 'floor' does not have a default value"),
            new Meteor.Error(500, "Cannot determine value", "The added field 'apartmentNumber' does not have a default value")]
        };

        expect(ret).toEqual(expected);

      });

      it('should take base schema and changed schema with an added field ' +
        'with no defaultValue and optional true field and return empty object', function () {
        let AddressSchema = new SimpleSchema({
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

        let AddressSchemaV2 = new SimpleSchema({
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
          },
          floor: {
            type: Number,
            max: 100,
            min: 0,
            optional: true
          }
        });

        let ret = SimpleSchemaVersioning.getMigrationPlan(AddressSchema, AddressSchemaV2);

        let expected = {};

        expect(ret).toEqual(expected);

      });
    });

    describe('remove fields', function () {

      it('should take base schema and a changed schema with a removed field ' +
        'and return update, remove and find arguments', function () {
        let AddressSchema = new SimpleSchema({
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

        let AddressSchemaV2 = new SimpleSchema({
          street: {
            type: String,
            max: 100
          },
          city: {
            type: String,
            max: 50
          }
        });

        let ret = SimpleSchemaVersioning.getMigrationPlan(AddressSchema, AddressSchemaV2);

        let expected = {
          "update": [{"$or": [{"state": {"$exists": true}}, {"zip": {"$exists": true}}]}, {
            "$unset": {
              "state": "",
              "zip": ""
            }
          }],
          "find": [{"$or": [{"state": {"$exists": true}}, {"zip": {"$exists": true}}]}, {
            "fields": {
              "state": 1,
              "zip": 1
            }
          }]
        };

        expect(ret).toEqual(expected);

      });
    });

    describe('rename fields', function () {

      it('should take base schema and changed schema with a renamed field ' +
        'and return an object with errors array that states the error in creating a rename migration', function () {
        let AddressSchema = new SimpleSchema({
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

        let AddressSchemaV2 = new SimpleSchema({
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
          zipcode: {
            type: String,
            regEx: /^[0-9]{5}$/
          }
        });

        let ret = SimpleSchemaVersioning.getMigrationPlan(AddressSchema, AddressSchemaV2);

        let expected = {
          "update": [{"$or": [{"zip": {"$exists": true}}]}, {"$unset": {"zip": ""}}],
          "find": [{"$or": [{"zip": {"$exists": true}}]}, {"fields": {"zip": 1}}],
          "errors": [new Meteor.Error(500, "Cannot determine value", "The added field 'zipcode' does not have a default value")]
        }

        expect(ret).toEqual(expected);

      });
    });

    describe('merge migration plan', function () {

      it('should take base schema and a changed schema with a removed field and added field' +
        'and return update, remove and find arguments', function () {
        let AddressSchema = new SimpleSchema({
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

        let AddressSchemaV2 = new SimpleSchema({
          street: {
            type: String,
            max: 100
          },
          city: {
            type: String,
            max: 50
          },
          floor: {
            type: Number,
            min: 0,
            max: 120,
            defaultValue: 0
          }
        });

        let ret = SimpleSchemaVersioning.getMigrationPlan(AddressSchema, AddressSchemaV2);

        let expected = {
          "update": [{"$or": [{"state": {"$exists": true}}, {"zip": {"$exists": true}}, {"floor": {"$exists": false}}]}, {
            "$unset": {
              "state": "",
              "zip": ""
            }, "$set": {"floor": 0}
          }],
          "find": [{"$or": [{"state": {"$exists": true}}, {"zip": {"$exists": true}}, {"floor": {"$exists": false}}]}, {
            "fields": {
              "state": 1,
              "zip": 1,
              "floor": 0
            }
          }]
        };

        expect(ret).toEqual(expected);

      });
    });

    describe('change restrictions', function () {
      it('should detect change in restrictions and throw adequate errors', function () {
        let SchemaV1 = new SimpleSchema({
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

        let SchemaV2 = new SimpleSchema({
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
            type: Number,
            max: 99999,
            min: 0
          }
        });

        let actual = SimpleSchemaVersioning.getMigrationPlan(SchemaV1, SchemaV2)

        let expected = {
          "errors": [
            new Meteor.Error(500, "Type Cast Needed", "Field 'zip' has changed types from 'String' to 'Number'"),
            new Meteor.Error(500, "Values may not match", "Field 'zip' has new restriction 'max' with value '99999'"),
            new Meteor.Error(500, "Values may not match", "Field 'zip' has new restriction 'min' with value '0'")
          ]
        };

        expect(actual).toEqual(expected);
      });
    });

  });
});

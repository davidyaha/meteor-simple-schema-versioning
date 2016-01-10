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
          "update": [{"$or": [{"apartmentNumber": {"$exists": false}}]}, {
            "$set": {"apartmentNumber": 1},
            "$unset": {}
          }],
          "remove": [{}, {}],
          "find": [{"$or": [{"apartmentNumber": {"$exists": false}}]}, {"fields": {"apartmentNumber": 0}}],
          "errors": []
        };


        expect(ret).toEqual(expected);

      });

    });

    describe('remove fields', function () {

      it('should take base schema and a changed schema with a removed field ' +
        'and return uoadte, remove and find arguments', function () {
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
          "update": [{"$or": [{"zip": {"$exists": true}}]}, {"$set": {}, "$unset": {"zip": ""}}],
          "remove": [{}, {}],
          "find": [{"$or": [{"zip": {"$exists": true}}]}, {"fields": {"zip": 1}}],
          "errors": []
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
            "update": [{"$or": []}, {"$set": {}, "$unset": {}}],
            "remove": [{}, {}],
            "find": [{"$or": []}, {"fields": {}}],
            "errors": [{
              "error": 500,
              "reason": "Cannot determine value",
              "details": "The added field 'zipcode' does not have a default value",
              "message": "Cannot determine value [500]",
              "errorType": "Meteor.Error"
            }]
          };

        expect(ret).toEqual(expected);

      });
    });

  });
});

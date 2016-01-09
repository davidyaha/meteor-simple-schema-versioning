/**
 * Created by David Yahalomi on 01/01/2016.
 */

describe('SimpleSchemaVersioning', function () {

  describe('getMigrationPlan', function () {

    describe('add fields', function () {

      it('should take base schema and delta schema with an added field ' +
        'and return a backup query, up update and down update', function () {
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

        var ret = SimpleSchemaVersioning.getMigrationPlan(AddressSchema, AddressSchemaV2);

        expect(ret).toEqual({
          "migrate": [{"$or": [{"floor": {"$exists": false}}, {"apartmentNumber": {"$exists": false}}]}, {
            "$set": {
              "floor": 1,
              "apartmentNumber": 1
            }
          }],
          "backup": [{"$or": [{"floor": {"$exists": true}}, {"apartmentNumber": {"$exists": true}}]}, {
            "fields": {
              "floor": 1,
              "apartmentNumber": 1
            }
          }]
        });

      });

    });

    describe('remove fields', function () {

      it('should take base schema and delta schema with a removed field ' +
        'and return a backup query, up update and down update', function () {
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
          zip: {
            removed: true
          },
          state: {
            removed: true
          }
        });

        var ret = SimpleSchemaVersioning.getMigrationPlan(AddressSchema, AddressSchemaV2);

        expect(ret).toEqual({
          "migrate": [{"$or": [{"zip": {"$exists": true}}, {"state": {"$exists": true}}]}, {
            "$set": {},
            "$unset": {"zip": "", "state": ""}
          }],
          "backup": [{"$or": [{"zip": {"$exists": true}}, {"state": {"$exists": true}}]}, {
            "fields": {
              "zip": 1,
              "state": 1
            }
          }]
        });

      });
    });

    describe('rename fields', function () {

      it('should take base schema and delta schema with a renamed field ' +
        'and return a backup query, up update and down update', function () {
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
          zipcode: {
            renamed: 'zip'
          },
          state_us: {
            renamed: 'state'
          }
        });

        var ret = SimpleSchemaVersioning.getMigrationPlan(AddressSchema, AddressSchemaV2);

        expect(ret).toEqual({
            "migrate": [{"$or": [{"zip": {"$exists": true}}, {"state": {"$exists": true}}]}, {
              "$set": {},
              "$rename": {"zip": "zipcode", "state": "state_us"}
            }],
            "backup": [{"$or": [{"zip": {"$exists": true}}, {"state": {"$exists": true}}]}, {
              "fields": {
                "zip": 1,
                "state": 1
              }
            }]
          }
        );

      });
    });

  });
});

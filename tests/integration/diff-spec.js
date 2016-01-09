/**
 * Created by David Yahalomi on 01/01/2016.
 */
describe('SimpleSchemaVersioning', function () {
  describe('diff', function () {

    describe('showObjectDiff', function () {

      describe('flat simple schema', function () {

        let baseSchema = {
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
            regEx: /^US$/
          },
          zip: {
            type: String,
            regEx: /^\d{5}$/
          }
        };

        it('should detect equal schemas', function () {
          let changedSchema = baseSchema;

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);

          expect(actual).toBeUndefined();
        });

        it('should detect added fields and restrictions', function () {
          let changedSchema = {
            street: {
              type: String,
              max: 100
            },
            city: {
              type: String,
              max: 50,
              min: 2
            },
            state: {
              type: String,
              regEx: /^US$/
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
          };

          let expected = {
            "changed": "object change",
            "value": {
              "city": {
                "changed": "object change",
                "value": {
                  "min": {"changed": "added", "value": 2}
                }
              },
              "floor": {"changed": "added", "value": {"type": "Number", "max": 100, "min": 0, "defaultValue": 1}},
              "apartmentNumber": {
                "changed": "added",
                "value": {"type": "Number", "max": 999, "min": 1, "defaultValue": 1}
              }
            }
          };

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);

          expect(actual).toEqual(expected);

        });

        it('should detect removed fields and restrictions', function () {
          let changedSchema = {
            street: {
              type: String,
              max: 100
            },
            city: {
              type: String,
            },
            state: {
              type: String,
              regEx: /^US$/
            }
          };

          let expected = {
            "changed": "object change",
            "value": {
              "city": {"changed": "object change", "value": {"max": {"changed": "removed", "value": 50}}},
              "zip": {"changed": "removed", "value": {"type": "String", "regEx": /^\d{5}$/}}
            }
          };

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);

          expect(actual).toEqual(expected);

        });

        it('should detect change in type', function () {
          let changedSchema = {
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
              regEx: /^US$/
            },
            zip: {
              type: Number,
              regEx: /^\d{5}$/
            }
          };

          let expected = {
            "changed": "object change",
            "value": {
              "zip": {
                "changed": "object change",
                "value": {"type": {"changed": "primitive change", "removed": "String", "added": "Number"}}
              }
            }
          };

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);

          expect(actual).toEqual(expected);

        });

        it('should detect renaming as removal and then addition', function () {
          let changedSchema = {
            street: {
              type: String,
              max: 100
            },
            city: {
              type: String,
              max: 50
            },
            state_in_us: {
              type: String,
              regEx: /^US$/
            },
            zip: {
              type: String,
              regEx: /^\d{5}$/
            }
          };

          let expected = {
            "changed": "object change",
            "value": {
              "state": {
                "changed": "removed",
                "value": {
                  type: "String",
                  regEx: /^US$/
                }
              },
              "state_in_us": {
                "changed": "added",
                "value": {
                  type: "String",
                  regEx: /^US$/
                }
              }
            }
          };

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);

          expect(actual).toEqual(expected);

        });

        //it('should detect renaming as rename with assume renaming option on', function () {
        //  let changedSchema = {
        //    street: {
        //      type: String,
        //      max: 100
        //    },
        //    city: {
        //      type: String,
        //      max: 50
        //    },
        //    state_in_us: {
        //      type: String,
        //      regEx: /^US$/
        //    },
        //    zip: {
        //      type: String,
        //      regEx: /^\d{5}$/
        //    }
        //  };
        //
        //  let expected = {
        //    "changed": "object change",
        //    "value": {
        //      "state": {
        //        "changed": "removed",
        //        "value": {
        //          type: "String",
        //          regEx: /^US$/
        //        }
        //      },
        //      "state_in_us": {
        //        "changed": "added",
        //        "value": {
        //          type: "String",
        //          regEx: /^US$/
        //        }
        //      }
        //    }
        //  };
        //
        //  let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);
        //
        //  expect(actual).toEqual(expected);
        //
        //});

        it('should detect addition to allowedValues restriction', function () {
          let baseSchema = {
            street: {
              type: String,
              max: 100
            },
            city: {
              type: String,
              max: 50,
              allowedValues: ['New York City', 'San Francisco']
            },
            state: {
              type: String,
              regEx: /^US$/
            },
            zip: {
              type: Number,
              regEx: /^\d{5}$/
            }
          };

          let changedSchema = {
            street: {
              type: String,
              max: 100
            },
            city: {
              type: String,
              max: 50,
              allowedValues: ['New York City', 'San Francisco', 'Tel Aviv']
            },
            state: {
              type: String,
              regEx: /^US$/
            },
            zip: {
              type: Number,
              regEx: /^\d{5}$/
            }
          };

          let expected = {
              "changed": "object change",
              "value": {
                "city": {
                  "changed": "object change",
                  "value": {
                    "allowedValues": {
                      "changed": "object change",
                      "value": {"2": {"changed": "added", "value": "Tel Aviv"}}
                    }
                  }
                }
              }
            }
            ;

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);

          expect(actual).toEqual(expected);

        });

        it('should detect removal from allowedValues restriction', function () {
          let baseSchema = {
            street: {
              type: String,
              max: 100
            },
            city: {
              type: String,
              max: 50,
              allowedValues: ['New York City', 'San Francisco']
            },
            state: {
              type: String,
              regEx: /^US$/
            },
            zip: {
              type: Number,
              regEx: /^\d{5}$/
            }
          };

          let changedSchema = {
            street: {
              type: String,
              max: 100
            },
            city: {
              type: String,
              max: 50,
              allowedValues: ['New York City']
            },
            state: {
              type: String,
              regEx: /^US$/
            },
            zip: {
              type: Number,
              regEx: /^\d{5}$/
            }
          };

          let expected = {
            "changed": "object change",
            "value": {
              "city": {
                "changed": "object change",
                "value": {
                  "allowedValues": {
                    "changed": "object change",
                    "value": {"1": {"changed": "removed", "value": "San Francisco"}}
                  }
                }
              }
            }
          };

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);

          expect(actual).toEqual(expected);

        });

        it('should detect same index change of allowedValues restriction', function () {
          let baseSchema = {
            street: {
              type: String,
              max: 100
            },
            city: {
              type: String,
              max: 50,
              allowedValues: ['New York City', 'San Francisco']
            },
            state: {
              type: String,
              regEx: /^US$/
            },
            zip: {
              type: Number,
              regEx: /^\d{5}$/
            }
          };

          let changedSchema = {
            street: {
              type: String,
              max: 100
            },
            city: {
              type: String,
              max: 50,
              allowedValues: ['New York City', 'Tel Aviv']
            },
            state: {
              type: String,
              regEx: /^US$/
            },
            zip: {
              type: Number,
              regEx: /^\d{5}$/
            }
          };

          let expected = {
            "changed": "object change",
            "value": {
              "city": {
                "changed": "object change",
                "value": {
                  "allowedValues": {
                    "changed": "object change",
                    "value": {"1": {"changed": "primitive change", "removed": "San Francisco", "added": "Tel Aviv"}}
                  }
                }
              }
            }
          };

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);

          expect(actual).toEqual(expected);

        });

        it('should detect change in regex', function () {
          let changedSchema = {
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
              regEx: /^US$/
            },
            zip: {
              type: String,
              regEx: /^\d{10}$/
            }
          };

          let expected = {
            "changed": "object change",
            "value": {
              "zip": {
                "changed": "object change",
                "value": {"regEx": {"changed": "primitive change", "removed": /^\d{5}$/, "added": /^\d{10}$/}}
              }
            }
          };

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);

          expect(actual).toEqual(expected);

        });

      });

      describe('simple schema inception', function () {

        let customerInfo = new SimpleSchema({
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
            regEx: /^US$/
          },
          zip: {
            type: String,
            regEx: /^\d{5}$/
          }
        });

        let baseSchema = new SimpleSchema({
          id: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
          },
          itemId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
          },
          customer: {
            type: customerInfo
          }
        });

        it('should detect equal schemas', function () {
          let changedSimpleSchema = new SimpleSchema(baseSchema);

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSimpleSchema);

          expect(actual).toBeUndefined();
        });

        it('should detect added fields and restrictions in inner schema', function () {
          let changedInnerSchema = new SimpleSchema({
            street: {
              type: String,
              max: 100
            },
            city: {
              type: String,
              max: 50,
              min: 2 // Added restriction
            },
            state: {
              type: String,
              regEx: /^US$/
            },
            zip: {
              type: String,
              regEx: /^\d{5}$/
            },
            // Added field
            floor: {
              type: Number,
              min: 1,
              max: 120
            }
          });

          let changedSchema = new SimpleSchema({
            id: {
              type: String,
              regEx: SimpleSchema.RegEx.Id
            },
            itemId: {
              type: String,
              regEx: SimpleSchema.RegEx.Id
            },
            customer: {
              type: changedInnerSchema
            }
          });

          let expected = {
            "changed": "object change",
            "value": {
              "customer.city": {"changed": "object change", "value": {"min": {"changed": "added", "value": 2}}},
              "customer.floor": {"changed": "added", "value": {"type": "Number", "min": 1, "max": 120}}
            }
          };

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);

          expect(actual).toEqual(expected);

        });

        it('should detect removed fields and restrictions', function () {
          let changedInnerSchema = new SimpleSchema({
            street: {
              type: String,
              max: 100
            },
            city: {
              type: String
              // Removed max length restriction
            },
            state: {
              type: String,
              regEx: /^US$/
            }
            // Removed zip field
          });

          let changedSchema = new SimpleSchema({
            id: {
              type: String,
              regEx: SimpleSchema.RegEx.Id
            },
            itemId: {
              type: String,
              regEx: SimpleSchema.RegEx.Id
            },
            customer: {
              type: changedInnerSchema
            }
          });

          let expected = {
            "changed": "object change",
            "value": {
              "customer.city": {"changed": "object change", "value": {"max": {"changed": "removed", "value": 50}}},
              "customer.zip": {"changed": "removed", "value": {"type": "String", "regEx": /^\d{5}$/}}
            }
          };

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);

          expect(actual).toEqual(expected);

        });

        it('should detect change in type', function () {
          let changedInnerSchema = new SimpleSchema({
            street: {
              type: String,
              max: 100
            },
            city: {
              type: String,
              max: 50,
            },
            state: {
              type: String,
              regEx: /^US$/
            },
            zip: {
              type: Number, //Changed from string to number
              regEx: /^\d{5}$/
            }
          });

          let changedSchema = new SimpleSchema({
            id: {
              type: String,
              regEx: SimpleSchema.RegEx.Id
            },
            itemId: {
              type: String,
              regEx: SimpleSchema.RegEx.Id
            },
            customer: {
              type: changedInnerSchema
            }
          });

          let expected = {
            "changed": "object change",
            "value": {
              "customer.zip": {
                "changed": "object change",
                "value": {"type": {"changed": "primitive change", "removed": "String", "added": "Number"}}
              }
            }
          };

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);

          expect(actual).toEqual(expected);

        });

        it('should detect renaming as removal and then addition', function () {
          let changedInnerSchema = new SimpleSchema({
            street: {
              type: String,
              max: 100
            },
            city: {
              type: String,
              max: 50
            },
            // Renamed field
            state_in_us: {
              type: String,
              regEx: /^US$/
            },
            zip: {
              type: String,
              regEx: /^\d{5}$/
            }
          });

          let changedSchema = new SimpleSchema({
            id: {
              type: String,
              regEx: SimpleSchema.RegEx.Id
            },
            itemId: {
              type: String,
              regEx: SimpleSchema.RegEx.Id
            },
            customer: {
              type: changedInnerSchema
            }
          });

          let expected = {
            "changed": "object change",
            "value": {
              "customer.state": {
                "changed": "removed",
                "value": {
                  type: "String",
                  regEx: /^US$/
                }
              },
              "customer.state_in_us": {
                "changed": "added",
                "value": {
                  type: "String",
                  regEx: /^US$/
                }
              }
            }
          };

          let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);

          expect(actual).toEqual(expected);
        });

        //it('should detect renaming as rename with assume renaming option on', function () {
        //  let changedInnerSchema = new SimpleSchema({
        //    street: {
        //      type: String,
        //      max: 100
        //    },
        //    city: {
        //      type: String,
        //      max: 50,
        //    },
        //    // Renamed field
        //    state_in_us: {
        //      type: String,
        //      regEx: /^US$/
        //    },
        //    zip: {
        //      type: String,
        //      regEx: /^\d{5}$/
        //    }
        //  });
        //
        //  let changedSchema = new SimpleSchema({
        //    id: {
        //      type: String,
        //      regEx: SimpleSchema.RegEx.Id
        //    },
        //    itemId: {
        //      type: String,
        //      regEx: SimpleSchema.RegEx.Id
        //    },
        //    customer: {
        //      type: changedInnerSchema
        //    }
        //  });
        //
        //  let expected = {
        //    "changed": "object change",
        //    "value": {
        //      "customer.state": {
        //        "changed": "removed",
        //        "value": {
        //          type: "String",
        //          regEx: /^US$/
        //        }
        //      },
        //      "customer.state_in_us": {
        //        "changed": "added",
        //        "value": {
        //          type: "String",
        //          regEx: /^US$/
        //        }
        //      }
        //    }
        //  };
        //
        //  let actual = SimpleSchemaVersioning.diff(baseSchema, changedSchema);
        //
        //  expect(actual).toEqual(expected);
        //
        //});

      });

    });

  });
});
/**
 * Created by David Yahalomi on 11/01/2016.
 */

describe('mergeObject', function () {
  it('should create a union of two arrays for every key with array value', function () {
    let first = {
      "errors": [{
        "error": 500,
        "reason": "Cannot determine value",
        "details": "The added field 'floor' does not have a default value",
        "message": "Cannot determine value [500]",
        "errorType": "Meteor.Error"
      }]
    };

    let second = {
      "errors": [{
        "error": 500,
        "reason": "Cannot determine value",
        "details": "The added field 'apartmentNumber' does not have a default value",
        "message": "Cannot determine value [500]",
        "errorType": "Meteor.Error"
      }]
    };

    let actual = SimpleSchemaVersioning.mergeObject(first, second);

    let expected = {
      "errors": [{
        "error": 500,
        "reason": "Cannot determine value",
        "details": "The added field 'floor' does not have a default value",
        "message": "Cannot determine value [500]",
        "errorType": "Meteor.Error"
      }, {
        "error": 500,
        "reason": "Cannot determine value",
        "details": "The added field 'apartmentNumber' does not have a default value",
        "message": "Cannot determine value [500]",
        "errorType": "Meteor.Error"
      }]
    };

    expect(actual).toEqual(expected);
  });
});

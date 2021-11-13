const { BadRequestError } = require("../../helpers/errors");
const { validateRequest } = require("../../helpers/validation");
const updateClub = require('../../schemas/updateClub.json');

describe('Validation helper functions', () => {
  describe('validateRequest', () => {
    it('Returns undefined if object passes jsonschema validation', () => {
      // Update club schema requires no values, so empty object should validate
      const result = validateRequest({}, updateClub);
      expect(result).toEqual(undefined);
    });

    it('Throws BadRequestError if object fails validation', () => {
      // Add value outside of schema to object
      expect(() => validateRequest({abc: 123}, updateClub)).toThrow(BadRequestError);
    });
  });
});
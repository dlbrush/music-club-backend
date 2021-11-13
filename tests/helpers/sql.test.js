const { handleUserFilters, handleClubFilters, handleUserClubFilters, createParamList, makeGenreValuesList, getOptionalPostColumns, addWhereOrAnd, addWhereOrOr,  } = require("../../helpers/sql")

describe('sql helper functions',  () => {
  describe('handleUserFilters', () => {
    it('Returns object with parameter array containing username with percent signs when one is passed', () => {
      const {parameters} = handleUserFilters('user');
      expect(parameters).toEqual(['%user%']);
    });

    it('Returns object with string for filtering by username when one is passed', () => {
      const {string} = handleUserFilters('user');
      expect(string).toEqual('WHERE username ILIKE $1');
    });

    it('Returns empty array and empty string when no username passed', () => {
      const obj = handleUserFilters();
      expect(obj).toEqual({
        parameters: [],
        string: ''
      });
    });
  });

  describe('handleClubFilters', () => {
    it('Returns string and empty parameters if only isPublic is passed', () => {
      const obj = handleClubFilters(true);
      expect(obj).toEqual({
        string: 'WHERE is_public=true',
        parameters: []
      });
    });

    it('Returns string and parameters with name if only name is passed', () => {
      const obj = handleClubFilters(undefined, 'club');
      expect(obj).toEqual({
        string: 'WHERE name ILIKE $1',
        parameters: ['%club%']
      });
    });

    it('Returns string with both columns and parameters with username if both name and isPublic=true are passed', () => {
      const obj = handleClubFilters(true, 'club');
      expect(obj).toEqual({
        string: 'WHERE is_public=true AND name ILIKE $1',
        parameters: ['%club%']
      });
    });

    it('Returns empty string and parameter array when no args passed', () => {
      const obj = handleClubFilters();
      expect(obj).toEqual({
        string: '',
        parameters: []
      });
    });
  });

  describe('handleUserClubFilters', () => {
    it('Returns string and parameters with username if only username is passed', () => {
      const obj = handleUserClubFilters('user');
      expect(obj).toEqual({
        string: 'WHERE username=$1',
        parameters: ['user']
      });
    });

    it('Returns string and parameters with club ID if only club ID is passed', () => {
      const obj = handleUserClubFilters(undefined, 1);
      expect(obj).toEqual({
        string: 'WHERE club_id=$1',
        parameters: [1]
      });
    });

    it('Returns string and parameters with both columns and parameters if club ID and username are both passed', () => {
      const obj = handleUserClubFilters('user', 1);
      expect(obj).toEqual({
        string: 'WHERE username=$1 AND club_id=$2',
        parameters: ['user', 1]
      });
    });

    it('Returns empty string and parameter array when no args passed', () => {
      const obj = handleUserClubFilters();
      expect(obj).toEqual({
        string: '',
        parameters: []
      });
    });
  });

  describe('createParamList', () => {
    it('Creates string containing params for each item in passed array', () => {
      const string = createParamList(['p1', 'p2'], 'column');
      expect(string).toEqual('WHERE column=$1 OR column=$2');
    });

    it('Returns empty string if passed empty array', () => {
      const string = createParamList([], 'column');
      expect(string).toEqual('');
    });
  });

  describe('makeGenreValuesList', () => {
    it('Returns string where each genre counts up from 2, and first value stays at $1', () => {
      const string = makeGenreValuesList(['rock', 'pop']);
      expect(string).toEqual('VALUES ($1, $2), ($1, $3)');
    });

    it('Returns empty string if passed empty array', () => {
      const string = makeGenreValuesList([]);
      expect(string).toEqual('');
    });
  });

  describe('getOptionalPostColumns', () => {
    it('Adds recTracks to columns and parameters, and adds paramCount to values, when only recTracks is passed', () => {
      const params = [];
      const { columns, values } = getOptionalPostColumns('all', undefined, params);
      expect(columns).toEqual(', rec_tracks');
      expect(values).toEqual(', $4');
      expect(params).toEqual(['all']);
    });

    it('Adds content to columns and parameters, and adds paramCount to values, when only content is passed', () => {
      const params = [];
      const { columns, values } = getOptionalPostColumns(undefined, 'content', params);
      expect(columns).toEqual(', content');
      expect(values).toEqual(', $4');
      expect(params).toEqual(['content']);
    });

    it('Adds recTracks and content to values, columns, and parameters, when both are passed', () => {
      const params = [];
      const { columns, values } = getOptionalPostColumns('all', 'content', params);
      expect(columns).toEqual(', rec_tracks, content');
      expect(values).toEqual(', $4, $5');
      expect(params).toEqual(['all', 'content']);
    });

    it('Returns empty strings and leaves params unchanged if no values passed', () => {
      const params = [];
      const { columns, values } = getOptionalPostColumns(undefined, undefined, params);
      expect(columns).toEqual('');
      expect(values).toEqual('');
      expect(params).toEqual([]);
    });
  });

  describe('addWhereOrAnd', () => {
    it('Returns AND with a space when string is not empty', () => {
      expect(addWhereOrAnd('and')).toEqual(' AND');
    });

    it('Returns WHERE when string is empty', () => {
      expect(addWhereOrAnd('')).toEqual('WHERE');
    });
  });

  describe('addWhereOrOr', () => {
    it('Returns OR with a space when string is not empty', () => {
      expect(addWhereOrOr('and')).toEqual(' OR');
    });

    it('Returns WHERE when string is empty', () => {
      expect(addWhereOrOr('')).toEqual('WHERE');
    });
  });
});
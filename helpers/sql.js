function handleUserFilters(username) {
  let parameters = [];
  let string = '';
  let paramCount = 0;
  if (username) {
    paramCount++;
    string += `${addWhereOrAnd(string)} username ILIKE $${paramCount}`;
    parameters.push(`%${username}%`);
  }
  return {parameters, string}
}

function handleClubFilters(isPublic, name) {
  let parameters = [];
  let string = '';
  if (isPublic === true) {
    string = 'WHERE is_public=true';
  }
  if (name) {
    string += `${addWhereOrAnd(string)} name ILIKE $1`;
    parameters.push(`%${name}%`);
  }
  return { parameters, string }
}

function handleUserClubFilters(username, clubId) {
  let parameters = [];
  let string = '';
  let paramCount = 0;
  if (username) {
    paramCount++;
    string = `WHERE username=$${paramCount}`;
    parameters.push(username);
  }
  if (clubId) {
    paramCount++;
    string += `${addWhereOrAnd(string)} club_id=$${paramCount}`;
    parameters.push(clubId);
  }
  return { parameters, string }
}

function handleVoteFilters(postId, username) {
  let parameters = [];
  let string = '';
  let paramCount = 0;
  if (postId) {
    paramCount++;
    string += `${addWhereOrAnd(string)} post_id=$${paramCount}`;
    parameters.push(postId);
  }
  if (username) {
    paramCount++;
    string = `${addWhereOrAnd(string)} username=$${paramCount}`;
    parameters.push(username);
  }
  return { parameters, string }
}

function createParamList(values, column) {
  let string = '';
  for (let i = 1; i <= values.length; i++) {
    string += `${addWhereOrOr(string)} ${column}=$${i}`;
  }
  return string;
}

function makeGenreValuesList(genres) {
  let result = '';
  let genreParamCount = 1;
  function commaOrValues(string) {
    return string.length ? ', ' : 'VALUES';
  }
  genres.forEach(genre => {
    genreParamCount++;
    result += `${commaOrValues(result)} ($1, $${genreParamCount})`;
  });
  return result;
}

function getOptionalPostColumns(recTracks, content, parameters) {
  // Param count starts at 3 because there are 3 columns that will always be passed 
  let paramCount = 3;
  let columns = '';
  let values = '';
  if(recTracks) {
    paramCount++;
    columns += ', rec_tracks';
    values += `, $${paramCount}`
    parameters.push(recTracks);
  }
  if(content) {
    paramCount++;
    columns += ', content';
    values += `, $${paramCount}`
    parameters.push(content);
  }
  return {columns, values}
}

function addWhereOrAnd(string) {
  return string.length ? ' AND' : 'WHERE'
}

function addWhereOrOr(string) {
  return string.length ? ' OR' : 'WHERE'
}


module.exports = {
  handleUserFilters,
  handleClubFilters,
  handleUserClubFilters,
  handleVoteFilters,
  createParamList,
  makeGenreValuesList,
  getOptionalPostColumns
}
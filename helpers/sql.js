function handleUserFilters(clubId, username) {
  let parameters = [];
  let string = '';
  let paramCount = 0;
  if (clubId) {
    paramCount++;
    string = `WHERE uc.club_id = $${paramCount}`;
    parameters.push(clubId);
  }
  if (username) {
    paramCount++;
    string += `${addWhereOrAnd(string)} u.username ILIKE $${paramCount}`;
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
  return {parameters, string}
}

function addWhereOrAnd(string) {
  return string.length ? ' AND' : 'WHERE'
}

module.exports = {
  handleUserFilters,
  handleClubFilters
}
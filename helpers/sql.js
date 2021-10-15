const CLUB_FILTER_STRING = `
    JOIN users_clubs uc ON uc.username = u.username
    WHERE uc.club_id = $1
  `

module.exports = {
  CLUB_FILTER_STRING
}
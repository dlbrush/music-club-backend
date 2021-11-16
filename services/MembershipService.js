const User = require('../models/User');
const Club = require('../models/Club');
const UserClub = require('../models/UserClub');
const { NotFoundError, BadRequestError, ExpressError } = require('../helpers/errors');

// Class containing methods regarding users and their membership in clubs
class MembershipService {
  static async join(username, clubId) {
    // Check that both the user and the club exist
    const user = await User.get(username);
    if (!user) {
      throw new NotFoundError(`User with username ${username} not found`);
    }
    const club = await Club.get(clubId);
    if (!club) {
      throw new NotFoundError(`Club with ID ${clubId} not found.`);
    }

    // Then check that the user is not already part of this club
    const isMember = await this.checkMembership(username, clubId);
    if (isMember) {
      throw new BadRequestError(`User ${username} is already in club ${club.name} (ID: ${clubId})`)
    }

    // If all checks are done, create a new UserClub
    const newUserClub = await UserClub.create(username, clubId);
    if (newUserClub) {
      return `User ${username} has successfully joined club ${club.name} (ID: ${clubId})`; 
    } else {
      throw new ExpressError(`Request for ${username} to join club ${club.name} (ID: ${clubId}) has failed.`)
    }
  }

  static async checkMembership(username, clubId) {
    const existingUserClub = await UserClub.get(username, clubId);
    return Boolean(existingUserClub);
  }

  /**
   * Add the founder of a club as a member of the club. Requires existing class objects for founder and club.
   * @param {User} founder 
   * @param {Club} club 
   */
  static async addFounder(founder, club) {
    const newUserClub = await UserClub.create(founder.username, club.id);
    // Set club.members to an array including the founder
    club.members = [founder];
    return `Founder ${founder.username} has successfully joined club ${club.name} (ID: ${club.id})`;
  }

  static async getClubMembers(clubId) {
    let members = [];
    const memberships = await UserClub.getAll(undefined, clubId);
    if (memberships) {
      const memberNames = memberships.map(membership => membership.username);
      members = await User.getSome(memberNames);
    }
    return members;
  }
}

module.exports = MembershipService;
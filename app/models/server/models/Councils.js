import { Base } from './_Base';

class Councils extends Base {
	constructor() {
		super('councils');
	}

	// INSERT
	create(data) {
		return this.insert(data);
	}

	// REMOVE
	removeById(_id) {
		return this.remove({ _id });
	}

	// UPDATE
	updateCouncil(_id, data) {
		data._updatedAt = new Date();
		return this.update({ _id }, { $set: { ...data } });
	}

	addUserToCouncil(_id, userId) {
		const data = this.findOne({ _id });
		data._updatedAt = new Date();
		data.invitedUsers = data.invitedUsers ? [...data.invitedUsers, userId] : [userId];

		return this.update({ _id }, { $set: { ...data } });
	}

	addUsersToCouncil(_id, usersId) {
		const data = this.findOne({ _id });
		data._updatedAt = new Date();
		data.invitedUsers = data.invitedUsers ? data.invitedUsers.concat(usersId) : usersId;

		return this.update({ _id }, { $set: { ...data } });
	}

	removeUserFromCouncil(councilId, userId) {
		const data = this.findOne({ _id: councilId });
		if (data.invitedUsers) {
			this.update({ _id: councilId }, { $pull: { invitedUsers: userId } });
		}
	}

	addPersonToCouncil(_id, person) {
		const data = this.findOne({ _id });
		data._updatedAt = new Date();
		data.invitedPersons = data.invitedPersons ? [...data.invitedPersons, person] : [person];

		return this.update({ _id }, { $set: { ...data } });
	}

	updatePersonCouncil(_id, person, index) {
		const data = this.findOne({ _id });
		data._updatedAt = new Date();
		data.invitedUsers[index] = person;

		return this.update({ _id }, { $set: { ...data } });
	}
}

export default new Councils();

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

	addPersonToCouncil(_id, person) {
		const data = this.findOne({ _id });
		data._updatedAt = new Date();
		data.invitedUsers = data.invitedUsers ? [...data.invitedUsers, person] : [person];

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

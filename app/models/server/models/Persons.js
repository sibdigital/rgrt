import { Base } from './_Base';

class Persons extends Base {
	constructor() {
		super('persons');
	}

	create(person) {
		person.createdAt = new Date();
		return this.insert(person);
	}

	updatePerson(_id, person) {
		const data = this.findOne({ _id });
		data._updatedAt = new Date();

		return this.update({ _id }, { $set: { ...data, ...person } });
	}

	addToCouncil(council, personId) {
		const data = this.findOne({ _id: personId });
		data._updatedAt = new Date();
		data.councils = data.councils ? [...data.councils, council] : [council];

		return this.update({ _id: personId }, { $set: { ...data } });
	}

	removeFromCouncil(councilId, personId) {
		const data = this.findOne({ _id: personId });
		if (data.councils) {
			return this.update({ _id: personId }, { $pull: { councils: { _id: councilId } } });
		}
	}
}

export default new Persons();

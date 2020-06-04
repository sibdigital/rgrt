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
		return this.update( { _id },{ $set: { ...data } });
	}
}

export default new Councils();

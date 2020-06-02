import { Base } from './_Base';

class Councils extends Base {
	constructor() {
		super('meetings');
	}

	// INSERT
	create(data) {
		return this.insert(data);
	}

	// REMOVE
	removeById(_id) {
		return this.remove({ _id });
	}
}

export default new Councils();

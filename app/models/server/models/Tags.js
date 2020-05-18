import { Base } from './_Base';

export class Tags extends Base {
	constructor() {
		super('tags');

		this.tryEnsureIndex({ name: 1 });
	}

	findOneById(_id, options) {
		return this.findOne(_id, options);
	}

	findByName(name, options) {
		const query = {
			name,
		};

		return this.find(query, options);
	}

	findByNameExceptId(name, except, options) {
		const query = {
			_id: { $nin: [except] },
			name,
		};

		return this.find(query, options);
	}

	// INSERT
	create(data) {
		return this.insert(data);
	}

	// update
	setName(_id, name) {
		const update = {
			$set: {
				name,
			},
		};

		return this.update({ _id }, update);
	}

	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}
}

export default new Tags();

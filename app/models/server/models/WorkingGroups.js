import { Base } from './_Base';

class WorkingGroups extends Base {
	constructor() {
		super('working-groups');
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
	updateWorkingGroup(_id, data) {
		data._updatedAt = new Date();
		return this.update({ _id }, { $set: { ...data } });
	}
}

export default new WorkingGroups();

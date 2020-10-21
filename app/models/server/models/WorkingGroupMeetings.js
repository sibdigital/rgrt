import { Base } from './_Base';

class WorkingGroupMeetings extends Base {
	constructor() {
		super('working-group-meetings');
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
	updateWorkingGroupMeeting(_id, data) {
		data._updatedAt = new Date();
		return this.update({ _id }, { $set: { ...data } });
	}

	addFilesToWorkingGroupMeeting(_id, files) {
		const data = this.findOne({ _id });
		console.log('app/models/server/models/workingGroupMeetings ', data);
		data._updatedAt = new Date();
		data.files = data.files ? [...data.files, files] : [files];
		console.log('app/models/server/models/workingGroupMeetings after files ', data);

		return this.update({ _id }, { $set: { ...data } });
	}
}

export default new WorkingGroupMeetings();

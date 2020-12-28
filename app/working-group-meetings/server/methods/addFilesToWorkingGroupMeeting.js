import { Meteor } from 'meteor/meteor';

import { WorkingGroupMeetings } from '../../../models';

Meteor.methods({
	addFilesToWorkingGroupMeeting(id, files) {
		if (!id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'addFilesToWorkingGroupMeeting', field: 'id' });
		}

		if (!files) {
			throw new Meteor.Error('error-the-field-is-required', 'The field files is required', { method: 'addFilesToWorkingGroupMeeting', field: 'files' });
		}

		return WorkingGroupMeetings.addFilesToWorkingGroupMeeting(id, files);
	},
});

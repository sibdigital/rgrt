import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { WorkingGroupMeetings } from '../../../models';

Meteor.methods({
	insertOrUpdateWorkingGroupMeeting(workingGroupMeetingData) {
		if (!hasPermission(this.userId, 'manage-working-group')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!s.trim(workingGroupMeetingData.d)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field firstName is required', { method: 'insertOrUpdateWorkingGroupMeeting', field: 'd' });
		}

		if (!s.trim(workingGroupMeetingData.desc)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field lastName is required', { method: 'insertOrUpdateWorkingGroupMeeting', field: 'desc' });
		}

		if (!workingGroupMeetingData._id) {
			const createWorkingGroupMeeting = {
				d: workingGroupMeetingData.d,
				desc: workingGroupMeetingData.desc,
				files: workingGroupMeetingData.files,
			};

			const _id = WorkingGroupMeetings.create(createWorkingGroupMeeting);

			return _id;
		}

		return WorkingGroupMeetings.updateWorkingGroup(workingGroupMeetingData._id, workingGroupMeetingData);
	},
});

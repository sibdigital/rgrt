import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { WorkingGroupsRequests } from '../../../models/server';

Meteor.methods({
	insertOrUpdateWorkingGroupRequestMail(requestId, workingGroupRequestMailData) {
		if (!hasPermission(this.userId, 'manage-working-group')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!s.trim(workingGroupRequestMailData.description)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field description is required', { method: 'insertOrUpdateWorkingGroupRequestMessage', field: 'description' });
		}

		if (!s.trim(workingGroupRequestMailData.number)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field number is required', { method: 'insertOrUpdateWorkingGroupRequestMessage', field: 'number' });
		}

		if (!workingGroupRequestMailData._id) {
			const createWorkingGroupRequestMail = {
				description: workingGroupRequestMailData.description,
				number: workingGroupRequestMailData.number,
				ts: new Date(),
				answers: [],
			};
			createWorkingGroupRequestMail._id = WorkingGroupsRequests.createWorkingGroupRequestMail(requestId, createWorkingGroupRequestMail);
			return createWorkingGroupRequestMail;
		}
		WorkingGroupsRequests.updateWorkingGroupRequestMail(requestId, workingGroupRequestMailData);
		return workingGroupRequestMailData;
	},
});

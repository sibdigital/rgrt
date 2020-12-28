import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { WorkingGroupsRequests } from '../../../models/server';

Meteor.methods({
	insertOrUpdateWorkingGroupRequest(workingGroupRequestData) {
		if (!hasPermission(this.userId, 'manage-working-group')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!s.trim(workingGroupRequestData.desc)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field desc is required', { method: 'insertOrUpdateWorkingGroupRequest', field: 'workingGroupRequestData' });
		}

		if (!workingGroupRequestData._id) {
			const inviteLink = new Date().getTime().toString().substr(0, 9);

			const createWorkingGroupRequest = {
				ts: new Date(),
				number: workingGroupRequestData.number,
				desc: workingGroupRequestData.desc,
				inviteLink,
			};

			const _id = WorkingGroupsRequests.create(createWorkingGroupRequest);

			return { _id, ts: createWorkingGroupRequest.ts };
		}

		return WorkingGroupsRequests.updateWorkingGroupRequest(workingGroupRequestData._id, workingGroupRequestData);
	},
});

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
		console.log({ workingGroupRequestData });

		if (!workingGroupRequestData._id) {
			const inviteLink = new Date().getTime().toString().substr(0, 9);

			const createWorkingGroupRequest = {
				ts: new Date(),
				number: workingGroupRequestData.number,
				desc: workingGroupRequestData.desc,
				date: workingGroupRequestData.date,
				protocolsItemId: workingGroupRequestData.protocolsItemId,
				inviteLink,
				protocolItemsId: workingGroupRequestData.protocolItemsId ?? [],
			};

			workingGroupRequestData.itemResponsible && Object.assign(createWorkingGroupRequest, { itemResponsible: workingGroupRequestData.itemResponsible });
			workingGroupRequestData.protocol && Object.assign(createWorkingGroupRequest, { protocol: workingGroupRequestData.protocol });
			workingGroupRequestData.council && Object.assign(createWorkingGroupRequest, { council: workingGroupRequestData.council });
			workingGroupRequestData.councilId && Object.assign(createWorkingGroupRequest, { councilId: workingGroupRequestData.councilId });
			workingGroupRequestData.protocolId && Object.assign(createWorkingGroupRequest, { protocolId: workingGroupRequestData.protocolId });
			workingGroupRequestData.requestType && Object.assign(createWorkingGroupRequest, { requestType: workingGroupRequestData.requestType });
			workingGroupRequestData.mail && Object.assign(createWorkingGroupRequest, { mail: workingGroupRequestData.mail });

			const _id = WorkingGroupsRequests.create(createWorkingGroupRequest);

			return { _id, ts: createWorkingGroupRequest.ts };
		}

		return WorkingGroupsRequests.updateWorkingGroupRequest(workingGroupRequestData._id, workingGroupRequestData);
	},
});

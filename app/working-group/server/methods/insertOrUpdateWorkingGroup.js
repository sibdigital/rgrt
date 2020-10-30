import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Users } from '../../../models/server';

Meteor.methods({
	insertOrUpdateWorkingGroup(workingGroupData) {
		if (!hasPermission(this.userId, 'manage-working-group')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!s.trim(workingGroupData.workingGroup)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field firstName is required', { method: 'insertOrUpdateWorkingGroup', field: 'workingGroup' });
		}

		if (!workingGroupData._id) {
			// const createWorkingGroupUser = {
			// 	email: workingGroupData.email,
			// 	name: workingGroupData.name,
			// 	surname: workingGroupData.surname,
			// 	patronymic: workingGroupData.patronymic,
			// 	phone: workingGroupData.phone,
			// 	position: workingGroupData.position,
			// 	workingGroup: workingGroupData.workingGroup,
			// };

			// const _id = WorkingGroups.create(createWorkingGroupUser);
			//
			// return _id;
			return null;
		}

		return Users.updateWorkingGroupById(workingGroupData._id, workingGroupData.workingGroup);
	},
});

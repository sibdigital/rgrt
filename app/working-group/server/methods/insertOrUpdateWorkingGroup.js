import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { WorkingGroups } from '../../../models';

Meteor.methods({
	insertOrUpdateWorkingGroup(workingGroupData) {
		if (!hasPermission(this.userId, 'manage-working-group')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!s.trim(workingGroupData.name)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field firstName is required', { method: 'insertOrUpdateWorkingGroup', field: 'name' });
		}

		if (!s.trim(workingGroupData.surname)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field lastName is required', { method: 'insertOrUpdateWorkingGroup', field: 'surname' });
		}

		if (!s.trim(workingGroupData.patronymic)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field patronymic is required', { method: 'insertOrUpdateWorkingGroup', field: 'patronymic' });
		}

		if (!s.trim(workingGroupData.position)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field position is required', { method: 'insertOrUpdateWorkingGroup', field: 'position' });
		}

		if (!s.trim(workingGroupData.phone)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field phone is required', { method: 'insertOrUpdateWorkingGroup', field: 'phone' });
		}

		if (!s.trim(workingGroupData.email)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field email is required', { method: 'insertOrUpdateWorkingGroup', field: 'email' });
		}

		if (!workingGroupData._id) {
			const createWorkingGroupUser = {
				email: workingGroupData.email,
				name: workingGroupData.name,
				surname: workingGroupData.surname,
				patronymic: workingGroupData.patronymic,
				phone: workingGroupData.phone,
				position: workingGroupData.position,
				workingGroupType: workingGroupData.workingGroupType,
			};

			const _id = WorkingGroups.create(createWorkingGroupUser);

			return _id;
		}

		return WorkingGroups.updateWorkingGroup(workingGroupData._id, workingGroupData);
	},
});

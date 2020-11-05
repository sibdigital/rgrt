import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { WorkingGroups } from '../../../models/server';

Meteor.methods({
	insertOrUpdateWorkingGroupComposition(workingGroupData) {
		if (!hasPermission(this.userId, 'manage-working-group')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!s.trim(workingGroupData.title)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field firstName is required', { method: 'insertOrUpdateWorkingGroupComposition', field: 'title' });
		}

		if (!workingGroupData._id) {
			const createWorkingGroupComposition = {
				title: workingGroupData.title,
			};

			const _id = WorkingGroups.create(createWorkingGroupComposition);
			return _id;
		}

		return WorkingGroups.updateWorkingGroup(workingGroupData._id, workingGroupData);
	},
});

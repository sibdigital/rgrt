import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { WorkingGroups } from '../../../models';

Meteor.methods({
	deleteWorkingGroupUser(workingGroupIdUser) {
		let user = null;

		if (hasPermission(this.userId, 'manage-working-group')) {
			user = WorkingGroups.findOneById(workingGroupIdUser);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (user == null) {
			throw new Meteor.Error('deleteWorkingGroupUser_Invalid', 'Invalid working group', { method: 'deleteWorkingGroupUser' });
		}

		WorkingGroups.removeById(workingGroupIdUser);

		return true;
	},
});

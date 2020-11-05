import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { WorkingGroups } from '../../../models';

Meteor.methods({
	deleteWorkingGroupComposition(workingGroupCompositionId) {
		let workingGroupComposition = null;

		if (hasPermission(this.userId, 'manage-working-group')) {
			workingGroupComposition = WorkingGroups.findOneById(workingGroupCompositionId);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (workingGroupComposition == null) {
			throw new Meteor.Error('workingGroupComposition_Invalid', 'Invalid working group', { method: 'deleteWorkingGroupComposition' });
		}

		WorkingGroups.removeById(workingGroupCompositionId);

		return true;
	},
});

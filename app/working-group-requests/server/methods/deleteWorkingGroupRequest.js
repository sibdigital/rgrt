import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { WorkingGroupsRequests } from '../../../models/server';

Meteor.methods({
	deleteWorkingGroupRequest(_id) {
		if (!hasPermission(this.userId, 'manage-working-group')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!_id) {
			throw new Meteor.Error('incorrect id');
		}

		return WorkingGroupsRequests.removeById(_id);
	},
});

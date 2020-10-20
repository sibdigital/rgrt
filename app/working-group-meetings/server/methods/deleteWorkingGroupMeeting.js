import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { WorkingGroupMeetings } from '../../../models';

Meteor.methods({
	deleteWorkingGroupMeeting(workingGroupIdMeeting) {
		let meeting = null;

		if (hasPermission(this.userId, 'manage-working-group')) {
			meeting = WorkingGroupMeetings.findOneById(workingGroupIdMeeting);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (meeting == null) {
			throw new Meteor.Error('deleteWorkingGroupMeeting_Invalid', 'Invalid working group meeting', { method: 'deleteWorkingGroupMeeting' });
		}

		WorkingGroupMeetings.removeById(workingGroupIdMeeting);

		return true;
	},
});

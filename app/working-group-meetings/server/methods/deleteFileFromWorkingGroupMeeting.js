import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Uploads } from '../../../models';
import { FileUpload } from '../../../file-upload';

Meteor.methods({
	deleteFileFromWorkingGroupMeeting(fileId) {
		let file = null;

		if (hasPermission(this.userId, 'manage-working-group')) {
			file = Uploads.findOneById(fileId);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (file == null) {
			throw new Meteor.Error('deleteFileFromWorkingGroupMeeting_Invalid', 'Invalid workingGroupMeeting', { method: 'deleteFileFromWorkingGroupMeeting' });
		}

		FileUpload.getStore('Uploads').deleteById(fileId);

		return true;
	},
});

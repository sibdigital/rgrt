import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Councils, Uploads } from '../../../models';
import { FileUpload } from '../../../file-upload';

Meteor.methods({
	deleteFileFromCouncil(councilId, fileId) {
		let file = null;

		if (hasPermission(this.userId, 'manage-councils')) {
			file = Uploads.findOneById(fileId);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (file == null) {
			throw new Meteor.Error('deleteFileFromCouncil_Invalid', 'Invalid council', { method: 'deleteFileFromCouncil' });
		}

		FileUpload.getStore('Uploads').deleteById(fileId);
		Councils.removeUploadedFile(councilId, fileId);

		return true;
	},
});

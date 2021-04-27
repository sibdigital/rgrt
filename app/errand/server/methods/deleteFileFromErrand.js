import { Meteor } from 'meteor/meteor';

import { Errands } from '../../../models';
import { FileUpload } from '../../../file-upload';

Meteor.methods({
	deleteFileFromErrand(errandId, fileId) {
		if (!errandId) {
			throw new Meteor.Error('deleteFileFromErrand_Invalid', 'Invalid errandId', { method: 'deleteFileFromErrand' });
		}

		if (!fileId) {
			throw new Meteor.Error('deleteFileFromErrand_Invalid', 'Invalid fileId', { method: 'deleteFileFromErrand' });
		}

		FileUpload.getStore('Uploads').deleteById(fileId);
		Errands.removeUploadedFile(errandId, fileId);

		return true;
	},
});

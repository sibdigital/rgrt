import { Meteor } from 'meteor/meteor';

import { Uploads } from '../../../models';
import { FileUpload } from '../../../file-upload';

Meteor.methods({
	deleteMaterial(materialId) {
		if (!materialId) {
			throw new Meteor.Error('deleteMaterial_Invalid', 'Invalid materialId', { method: 'deleteMaterial' });
		}

		const file = Uploads.findOne({ _id: materialId });

		if (!file) {
			throw new Meteor.Error('deleteMaterial_Invalid', 'Invalid file', { method: 'deleteMaterial' });
		}

		FileUpload.getStore('Uploads').deleteById(materialId);
		return true;
	},
});

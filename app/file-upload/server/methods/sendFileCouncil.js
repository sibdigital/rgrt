import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Uploads, Councils } from '../../../models';
import { FileUpload } from '../lib/FileUpload';

Meteor.methods({
	async sendFileCouncil(councilId, file) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendFileCouncil' });
		}

		Uploads.updateFileComplete(file._id, Meteor.userId(), _.omit(file, '_id'));

		const fileUrl = FileUpload.getPath(`${ file._id }/${ encodeURI(file.name) }`);

		const attachment = {
			_id: file._id,
			orderIndex: parseInt(file.orderIndex),
			title: file.name,
			type: 'file',
			description: file.description ?? '',
			ts: file.ts,
			...file.tag && { tag: file.tag },
			title_link: fileUrl,
			title_link_download: true,
		};

		if (/^image\/.+/.test(file.type)) {
			attachment.image_url = fileUrl;
			attachment.image_type = file.type;
			attachment.image_size = file.size;
			if (file.identify && file.identify.size) {
				attachment.image_dimensions = file.identify.size;
			}
			try {
				attachment.image_preview = await FileUpload.resizeImagePreview(file);
			} catch (e) {
				delete attachment.image_url;
				delete attachment.image_type;
				delete attachment.image_size;
				delete attachment.image_dimensions;
			}
		} else if (/^audio\/.+/.test(file.type)) {
			attachment.audio_url = fileUrl;
			attachment.audio_type = file.type;
			attachment.audio_size = file.size;
		} else if (/^video\/.+/.test(file.type)) {
			attachment.video_url = fileUrl;
			attachment.video_type = file.type;
			attachment.video_size = file.size;
		}

		Councils.uploadFile(councilId, attachment);
		return attachment;
	},
});

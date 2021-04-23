import { Meteor } from 'meteor/meteor';
import Busboy from 'busboy';

import { API } from '../api';
import { findWorkingGroups, findOneWorkingGroup, findWorkingGroup } from '../lib/working-groups';
import { FileUpload } from '../../../file-upload';

API.v1.addRoute('working-groups.list', { authRequired: false }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query, stockFields } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findWorkingGroups({
			query,
			fields: stockFields,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('working-group.getOne', { authRequired: false }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findOneWorkingGroup(query._id)));
	},
});

API.v1.addRoute('working-group.findOne', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findWorkingGroup(query._id)));
	},
});

const getFiles = Meteor.wrapAsync(({ request }, callback) => {
	const busboy = new Busboy({ headers: request.headers });
	const files = [];

	const fields = {};


	busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
		if (fieldname !== 'file') {
			return callback(new Meteor.Error('invalid-field'));
		}

		const fileDate = [];
		file.on('data', (data) => fileDate.push(data));

		file.on('end', () => {
			files.push({ fieldname, file, filename, encoding, mimetype, fileBuffer: Buffer.concat(fileDate) });
		});
	});

	busboy.on('field', (fieldname, value) => { fields[fieldname] = value; });

	busboy.on('finish', Meteor.bindEnvironment(() => callback(null, { files, fields })));

	request.pipe(busboy);
});

API.v1.addRoute('composition-of-the-working-group.upload/:id', { authRequired: true }, {
	post() {
		const { files, fields } = getFiles({
			request: this.request,
		});

		if (files.length === 0) {
			console.log('api.v1.route file required');
			return API.v1.failure('File required');
		}

		if (files.length > 1) {
			console.log('api.v1.route just 1 file is allowed');
			return API.v1.failure('Just 1 file is allowed');
		}

		const file = files[0];

		const details = {
			name: file.filename,
			size: file.fileBuffer.length,
			type: file.mimetype,
			compositionOfTheWorkingGroup: this.urlParams.id,
			userId: this.userId,
		};

		const fileData = Meteor.runAsUser(this.userId, () => {
			const fileStore = FileUpload.getStore('Uploads');
			const uploadedFile = fileStore.insertSync(details, file.fileBuffer);

			uploadedFile.description = fields.description;
			return uploadedFile;
		});
		return API.v1.success({ _id: fileData._id });
	},
});

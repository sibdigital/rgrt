import { Meteor } from 'meteor/meteor';
import Busboy from 'busboy';

import { API } from '../api';
import { findPersons, findPerson } from '../lib/persons';
import { file } from '/mocha_end_to_end.opts';
import { FileUpload } from '../../../file-upload';

API.v1.addRoute('persons.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query, stockFields } = this.parseJsonQuery();

		if (query.isAllow) {
			API.v1.success({
				persons: [],
				count: 0,
				offset: 0,
				total: 0,
			});
		}

		return API.v1.success(Promise.await(findPersons({
			query,
			pagination: {
				offset,
				count,
				sort,
			},
			fields: stockFields,
		})));
	},
});

API.v1.addRoute('persons.listToAutoComplete', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findPersons({
			query,
			fields: { surname: 1, name: 1, patronymic: 1, userId: 1 },
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('persons.findOne', { authRequired: false }, {
	get() {
		const userId = Meteor.userId();
		if (!userId) {
			return API.v1.success({});
		}

		const { query, stockFields } = this.parseJsonQuery();
		const cursor = Promise.await(findPerson(query, { fields: stockFields }));
		console.log({ cursor });

		return API.v1.success(cursor ?? {});
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

API.v1.addRoute('persons.uploadAvatar', { authRequired: true }, {
	post() {
		const { files, fields } = getFiles({
			request: this.request,
		});

		const file = files[0];

		// console.log({ files, fields })

		const details = {
			name: file.fieldname,
			size: file.fileBuffer.length,
			type: file.mimetype,
			ts: fields.ts
		}

		const fileData = Meteor.runAsUser(this.userId, () => {
			const fileStore = FileUpload.getStore('Uploads');
			const uploadedFile = fileStore.insertSync(details, file.fileBuffer);
			console.log(uploadedFile)
			console.log(fileStore)

			uploadedFile.description = fields.description;
			uploadedFile.ts = fields.ts;

			//Meteor.call('sendFileCouncil', this.urlParams.id, uploadedFile);

			return uploadedFile;
		});
		return API.v1.success({ _id: fileData._id, url: fileData.url });
	}
})

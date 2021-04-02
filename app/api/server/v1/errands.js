import { Meteor } from 'meteor/meteor';
import Busboy from 'busboy';

import { API } from '../api';
import { findErrands, findErrand } from '../lib/errands';
import { Persons } from '../../../models/server';
import { hasPermission } from '../../../authorization';
import { FileUpload } from '../../../file-upload';


API.v1.addRoute('errands-on-message.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findErrands({
			query,
			options: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('errands', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-c-room')) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		if (sort && Object.keys(sort).length > 1) {
			return API.v1.failure('This method support only one "sort" parameter');
		}

		const userId = Meteor.userId();

		const person = Persons.findOne({ userId: userId });

		const formedQuery = {};

		switch (query.type) {
			case 'initiated_by_me':
				formedQuery['initiatedBy._id'] = `${ userId }`;
				break;
			case 'charged_to_me':
				formedQuery['chargedTo.person._id'] = `${ person._id }`;
				break;
		}

		if (query.mid) {
			formedQuery.mid = `${ query.mid }`;
		}

		if (query._id) {
			formedQuery._id = query._id;
		}

		const sortBy = sort ? Object.keys(sort)[0] : 'ts';
		const sortDirection = sort && Object.values(sort)[0] === 1 ? 'asc' : 'desc';

		const result = Meteor.runAsUser(this.userId, () => Meteor.call('browseErrands', {
			query: formedQuery,
			sortBy,
			sortDirection,
			offset: Math.max(0, offset),
			limit: Math.max(0, count),
		}));

		if (!result) {
			return API.v1.failure('Please verify the parameters');
		}
		return API.v1.success({
			result: result.results,
			count: result.results.length,
			offset,
			total: result.total,
		});
	},
});

API.v1.addRoute('errands.findOne', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		const cursor = Promise.await(findErrand(query._id));
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

API.v1.addRoute('errands.upload/:id', { authRequired: false }, {
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
			errandId: this.urlParams.id,
		};

		// TODO: Requires user ID to upload file
		const fileData = Meteor.runAsUser('rocket.cat', () => {
			const fileStore = FileUpload.getStore('Uploads');
			const uploadedFile = fileStore.insertSync(details, file.fileBuffer);

			uploadedFile.description = fields.description;

			Meteor.call('sendFileErrand', this.urlParams.id, uploadedFile);

			return uploadedFile;
		});
		return API.v1.success({ _id: fileData._id });
	},
});

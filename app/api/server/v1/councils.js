import { Meteor } from "meteor/meteor";

import { API } from '../api';
import { findCouncils, findOneCouncil, findCouncil, findOneCouncilByInviteLink } from '../lib/councils';
import { hasPermission } from '../../../authorization';
import { FileUpload } from '../../../file-upload';
import { Users } from '../../../models';
import { Persons } from '../../../models';

import Busboy from 'busboy';

API.v1.addRoute('councils.list', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-c-room')) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findCouncils({
			query,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('councils.getOne', { authRequired: false }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findOneCouncil(query._id)));
	},
});

API.v1.addRoute('councils.getOneByInviteLink', { authRequired: false }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findOneCouncilByInviteLink(query.inviteLink)));
	},
});

API.v1.addRoute('councils.findOne', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findCouncil(query._id)));
	},
});

API.v1.addRoute('councils.invitedPersons', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-c-room')) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const council = Promise.await(findCouncil(query._id));

		const persons = Persons.find({ _id: { $in: council.invitedPersons.map((user) => user._id ) } }, {
			sort: sort || { surname: 1, name: 1, patronymic: 1 },
			skip: offset,
			limit: count,
			fields: { _id: 1, surname: 1, name: 1, patronymic: 1, phone: 1, email: 1 },
		}).fetch().map((user) => { 
			const iUser = council.invitedPersons.find((iUser) => iUser._id === user._id);
			if (!iUser) { return; }
			if (!iUser.ts) {
				user.ts = new Date('January 1, 2021 00:00:00');
			} else {
				user.ts = iUser.ts;
			}
			return user;
		});

		return API.v1.success({
			persons,
			count: persons.length,
			offset,
			total: Persons.find({ _id: { $in: council.invitedPersons.map((iPerson) => iPerson._id) } }).count(),
		});
	},
});

API.v1.addRoute('councils.invitedUsers', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-c-room')) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const council = Promise.await(findCouncil(query.$and[1]._id));

		const users = Users.find({ _id: { $in: council.invitedUsers.map((user) => typeof user === typeof {} ? user._id : user ) } }, {
		// const users = Users.find({ _id: { $in: council.invitedUsers } }, {
			sort: sort || { username: 1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch().map((user) => { 
			const iUser = council.invitedUsers.find((iUser) => (typeof iUser === typeof {} && iUser._id === user._id) || (typeof iUser === typeof '' && iUser === user._id));
			if (!iUser) { return; }
			if (!iUser.ts) {
				user.ts = new Date('January 1, 2021 00:00:00');
			} else {
				user.ts = iUser.ts;
			}
			return user;
		});

		return API.v1.success({
			invitedUsers: users,
			count: users.length,
			offset,
			total: Users.find({ _id: { $in: council.invitedUsers } }).count(),
		});
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

API.v1.addRoute('councils.upload/:id', { authRequired: true }, {
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
			workingGroupMeetingId: this.urlParams.id,
			userId: this.userId,
		};

		const fileData = Meteor.runAsUser(this.userId, () => {
			const fileStore = FileUpload.getStore('Uploads');
			const uploadedFile = fileStore.insertSync(details, file.fileBuffer);

			uploadedFile.description = fields.description;

			Meteor.call('sendFileCouncil', this.urlParams.id, uploadedFile);

			return uploadedFile;
		});
		return API.v1.success({ _id: fileData._id });
	},
});
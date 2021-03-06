import Busboy from 'busboy';
import { Meteor } from 'meteor/meteor';

import { API } from '../api';
import { FileUpload } from '../../../file-upload';
import { Persons, Users } from '../../../models/server/index';
import { getMaxRequestNumber, findWorkingGroupRequestAnswerByAnswerId, findWorkingGroupsRequests, findOneWorkingGroupRequestByInviteLink, findWorkingGroupRequest, findWorkingGroupRequestMailByMailId, findWorkingGroupRequestMailAnswerByAnswerId, findWorkingGroupRequestByProtocolsItemId } from '../lib/working-groups-requests';

API.v1.addRoute('working-groups-requests.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query, stockFields } = this.parseJsonQuery();

		const userId = Meteor.userId();
		const user = Users.findOneById(userId, { fields: { roles: 1, personId: 1 } });
		const isUser = user?.roles?.includes('admin') || user?.roles?.includes('secretary');

		if (!isUser) {
			const person = Promise.await(Persons.findOne({ userId }, { fields: { _id: 1 } }));
			// const newPerson = Promise.await(Persons.findOne({ _id: userRoles.personId }));
			console.dir({ user, person });

			return API.v1.success(Promise.await(findWorkingGroupsRequests({
				query: { 'itemResponsible._id': user.personId ?? person?._id ?? '' },
				fields: stockFields,
				pagination: {
					offset,
					count,
					sort,
				},
			})));
		}

		return API.v1.success(Promise.await(findWorkingGroupsRequests({
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

API.v1.addRoute('working-groups-requests.inviteList', { authRequired: false }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findWorkingGroupsRequests({
			query,
			fields: { number: 1, desc: 1, date: 1, ts: 1 },
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('working-groups-requests.findOne', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		const cursor = Promise.await(findWorkingGroupRequest(query._id));
		return API.v1.success(cursor ?? {});
	},
});

API.v1.addRoute('working-groups-requests.findMailOne', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findWorkingGroupRequestMailByMailId(query._id, query.mailId)));
	},
});

API.v1.addRoute('working-groups-requests.findAnswerOne', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findWorkingGroupRequestMailAnswerByAnswerId(query._id, query.mailId, query.answerId)));
	},
});

API.v1.addRoute('working-groups-requests.findAnswerOneById', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findWorkingGroupRequestAnswerByAnswerId(query._id, query.answerId)));
	},
});

API.v1.addRoute('working-groups-requests.getOneByInviteLink', { authRequired: false }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findOneWorkingGroupRequestByInviteLink(query.inviteLink, { fields: { createdBy: 1, protocol: 1, requestType: 1, mail: 1, protocolItemsId: 1, desc: 1, date: 1, ts: 1, number: 1 } })));
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

API.v1.addRoute('working-groups-requests.upload/:id/:answerId', { authRequired: false }, {
	post() {
		const { files, fields } = getFiles({
			request: this.request,
		});

		if (files.length === 0) {
			console.log('api.v1.route file required');
			return API.v1.failure('File required');
		}

		if (files.length > 1) {
			console.log('api.v1.route just 3 file is allowed');
			return API.v1.failure('Just 3 file is allowed');
		}

		const file = files[0];

		const details = {
			name: file.filename,
			size: file.fileBuffer.length,
			type: file.mimetype,
			workingGroupRequestId: this.urlParams.id,
			workingGroupRequestMailId: this.urlParams.mailId,
			workingGroupRequestAnswerId: this.urlParams.answerId,
		};

		// TODO: Requires user ID to upload file
		const fileData = Meteor.runAsUser('rocket.cat', () => {
			const fileStore = FileUpload.getStore('Uploads');
			const uploadedFile = fileStore.insertSync(details, file.fileBuffer);

			uploadedFile.description = fields.description;

			Meteor.call('sendFileWorkingGroupRequestAnswer', this.urlParams.id, this.urlParams.answerId, uploadedFile);

			return uploadedFile;
		});
		return API.v1.success({ _id: fileData._id });
	},
});

API.v1.addRoute('working-groups-requests.findByProtocolsItemId', { authRequired: true }, {
	get() {
		const { query, stockFields } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findWorkingGroupRequestByProtocolsItemId(query.protocolsItemId, { fields: stockFields ?? { _id: 1 } })));
	},
});

API.v1.addRoute('working-groups-requests.getMaxRequestNumber', { authRequired: true }, {
	get() {
		const cursor = Promise.await(getMaxRequestNumber());
		return API.v1.success(cursor ?? {});
	},
});

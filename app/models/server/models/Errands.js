// import { Match } from 'meteor/check';
// import _ from 'underscore';

// import { Meteor } from 'meteor/meteor';

import { Base } from './_Base';
import Rooms from './Rooms';
// import { settings } from '../../../settings/server/functions/settings';

export class Errands extends Base {
	constructor() {
		super('errand');

		this.tryEnsureIndex({ rid: 1, ts: 1 });
		this.tryEnsureIndex({ ts: 1 });
		this.tryEnsureIndex({ 'initiatedBy._id': 1 });
		this.tryEnsureIndex({ 'chargedTo._id': 1 });
		this.tryEnsureIndex({ editedAt: 1 }, { sparse: true });
		this.tryEnsureIndex({ 'editedBy._id': 1 }, { sparse: true });
		this.tryEnsureIndex({ rid: 1, t: 1, 'u._id': 1 });
		this.tryEnsureIndex({ rid: 1, t: 1, 'initiatedBy._id': 1 });
		this.tryEnsureIndex({ rid: 1, t: 1, 'chargedTo._id': 1 });
		this.tryEnsureIndex({ expireAt: 1 }, { sparse: true });
		this.tryEnsureIndex({ 'editedBy._id': 1 }, { sparse: true });
		this.tryEnsureIndex({ desc: 'text' });
	}

	create(data) {
		data.createdAt = new Date();
		this.insert(data);
		const errand = this.findOne({ createdAt: data.createdAt }, { fields: { _id: 1 } });
		return errand?._id ?? '';
	}

	// REMOVE
	removeById(_id) {
		return this.remove({ _id });
	}

	// UPDATE
	updateErrandWithNewData(_id, newData) {
		newData._updatedAt = new Date();
		return this.update({ _id }, { $set: { ...newData } });
	}

	addErrandDocument(errandId, fileData) {
		const data = this.findOne({ _id: errandId });

		data._updatedAt = new Date();
		if (data.documents) {
			data.documents.push(fileData);
		} else {
			data.documents = [fileData];
		}
		return this.update({ _id: errandId }, { $set: { ...data } });
	}

	findByInitiatedUserId(userId) {
		const query = { 'initiatedBy._id': userId };

		return this.find(query);
	}

	findByChargedUserId(userId) {
		const query = { 'initiatedBy._id': userId };

		return this.find(query);
	}

	readAnswer(_id) {
		const data = this.findOne({ _id });
		// console.log('data here');
		// console.dir({ data, _id });
		if (!data || data.unread === null || data.unread === undefined || !data.unread) {
			return;
		}

		data._updatedAt = new Date();
		data.unread = false;
		return this.update({ _id }, { $set: { ...data } });
	}

	removeUploadedFile(errandId, fileId) {
		const data = this.findOne({ _id: errandId });
		if (!data) {
			return false;
		}

		if (data.documents) {
			data._updatedAt = new Date();
			return this.update({ _id: errandId }, { $pull: { documents: { _id: fileId } } });
		}
	}

	updateFilesTag(errandId, filesIdArray, tag) {
		const data = this.findOne({ _id: errandId });
		if (!data || !data.documents) {
			return false;
		}

		data._updatedAt = new Date();

		data.documents = data.documents.map((file) => {
			if (filesIdArray.includes(file._id)) {
				file.tag = tag;
			}
			return file;
		});
		return this.update({ _id: errandId }, { $set: { ...data } });
	}
}

export default new Errands();

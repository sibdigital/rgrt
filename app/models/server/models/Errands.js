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

	// INSERT
	createWithRoomIdMessageIdDescriptionEndDateAndUsers(roomId, messageId, description, endDate, initiatedByUser, chargedToUser) {
		const record = {
			t: 'opened',
			rid: roomId,
			mid: messageId,
			ts: new Date(),
			desc: description,
			initiatedBy: {
				_id: initiatedByUser._id,
				username: initiatedByUser.username,
				name: initiatedByUser.name,
			},
			chargedToUser: {
				_id: chargedToUser._id,
				username: chargedToUser.username,
				name: chargedToUser.name,
			},
			expireAt: endDate,
			groupable: false,
		};
		record._id = this.insertOrUpsert(record);
		Rooms.incErrandCountById(roomId, 1);
		return record;
	}

	createWithDescriptionAndDataAndUsers(roomId, messageId, description, endDate, initiatedByUser, chargedToUser) {
		const record = {
			t: 'opened',
			rid: roomId,
			mid: messageId,
			ts: new Date(),
			desc: description,
			initiatedBy: {
				_id: initiatedByUser._id,
				username: initiatedByUser.username,
				name: initiatedByUser.name,
			},
			chargedToUser: {
				_id: chargedToUser._id,
				username: chargedToUser.username,
				name: chargedToUser.name,
			},
			expireAt: endDate,
			groupable: false,
		};
		record._id = this.insertOrUpsert(record);
		return record;
	}

	// UPDATE
	updateErrand(_id, newData) {
		newData._updatedAt = new Date();
		this.update({ _id }, { $set: { ...newData } });
		const update = this.findOne({ _id });
		return update;
	}

	findByRoomId(rid, options) {
		const query = {
			rid,
		};

		return this.find(query, options);
	}

	findByInitiatedUserId(userId) {
		const query = { 'initiatedBy._id': userId };

		return this.find(query);
	}

	findByChargedUserId(userId) {
		const query = { 'initiatedBy._id': userId };

		return this.find(query);
	}
}

export default new Errands();

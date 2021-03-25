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
		return this.insert(data);
	}

	// REMOVE
	removeById(_id) {
		return this.remove({ _id });
	}

	// UPDATE
	updateErrand(_id, newData) {
		newData._updatedAt = new Date();
		return this.update({ _id }, { $set: { ...newData } });
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

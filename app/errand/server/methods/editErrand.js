import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { hasAtLeastOnePermission, canAccessRoom } from '../../../authorization/server';
import { Errands, Rooms, Messages } from '../../../models/server';
import { settings } from '../../../settings/server';

const editErrand = (_id, newData) => Errands.updateErrand(_id, newData);

const getRoom = (rid) => {
	const room = Rooms.findOne(rid);
	return room && (room.prid ? Rooms.findOne(room.prid, { fields: { _id: 1 } }) : room);
};

const edit = ({ _id, chargedToUser, desc, expireAt, t }) => {
	/*
	const uid = Meteor.userId();
	const oldErrand = Errands.findOneById(errand._id);

	 if (oldErrand.t !== errand.t) {
		if (oldErrand.initiatedBy._id !== uid && oldErrand.chargedToUser._id !== uid) {

		}
	}*/


	const updatedErrand = editErrand(_id, { chargedToUser, desc, expireAt, t });

	return updatedErrand;
};

Meteor.methods({
	/**
	* Create errand by room or message
	* @constructor
	* @param {string} _id - id of updatable errand
	* @param {Object} chargedUsers - new charged user
	* @param {string} errandDescription - new description
	* @param {Date} expired_at - new expired date
	* @param {string} status - updatatble errand
	*/
	editErrand({ _id, chargedUsers, errandDescription, expired_at, status }) {
		if (!settings.get('Errand_enabled')) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to edit a errand', { method: 'editErrand' });
		}

		if (!_id) {
			throw new Meteor.Error('error-invalid-errand-id', 'errand ID cant be empty', { method: 'ErrandCreation' });
		}

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'ErrandCreation' });
		}

		/* if (!hasAtLeastOnePermission(uid, ['start-errand', 'start-errand-other-user'])) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to edit a errand', { method: 'editErrand' });
		}*/
		return edit({ _id, chargedToUser: chargedUsers, desc: errandDescription, expireAt: expired_at, t: status });
	},
});

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { hasAtLeastOnePermission, canAccessRoom } from '../../../authorization/server';
import { Errands, Rooms, Messages } from '../../../models/server';
import { settings } from '../../../settings/server';

const createErrandMessage = (rid, mid, dsc, expired_at, initiated_by, charged_to) => Errands.createWithRoomIdMessageIdDescriptionEndDateAndUsers(rid, mid, dsc, expired_at, initiated_by, charged_to);

const getRoom = (rid) => {
	const room = Rooms.findOne(rid);
	return room && (room.prid ? Rooms.findOne(room.prid, { fields: { _id: 1 } }) : room);
};

const mentionMessage = (mid, errand_id) => {
	const message = Messages.findById(mid);
	let errands = message.errand;
	if (errands) {
		console.log(typeof errands);
		if (typeof errands !== 'Array') {
			errands = [errands];
		}
	} else {
		errands = [];
	}

	const errand = [...errands, errand_id];
	return Messages.setErrand(mid, errand);
};

const create = ({ rid, mid, errandDescription, expired_at, initiated_by, charged_to, reply }) => {
	// if you set both, prid and pmid, and the rooms doesnt match... should throw an error)
	let message = false;
	if (mid) {
		message = Messages.findOne({ _id: mid });
		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', { method: 'ErrandCreation' });
		}
		if (rid) {
			console.log(getRoom(message.rid));
			/* if (rid !== getRoom(message.rid)._id) {
				throw new Meteor.Error('error-invalid-arguments', { method: 'ErrandCreation' });
			}*/
		} else {
			rid = message.rid;
		}
	}

	if (!rid) {
		throw new Meteor.Error('error-invalid-arguments', { method: 'ErrandCreation' });
	}

	const p_room = Rooms.findOne(rid);
	if (!p_room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'ErrandCreation' });
	}

	// Этот блок не позволяет согздавать много поручений на одном и том же сообщении
	/* if (mid) {
		const errandAlreadyExists = Errands.findOne({
			rid,
			mid,
		}, {
			fields: { _id: 1 },
		});
		if (errandAlreadyExists) { // do not allow multiple errands to the same message'\
			// addUserToRoom(errandAlreadyExists._id, user);
			throw new Meteor.Error('error-errand-exists', { method: 'ErrandCreation' });
		}
	}*/
	const errand = createErrandMessage(rid, mid, errandDescription, expired_at, initiated_by, charged_to);


	/* const errand = createErrandMessage('p', name, user.username, [...new Set(invitedUsers)], false, {
		fname: dsc,
		description: message.msg, // TODO errands remove
		topic: p_room.name, // TODO errands remove
		prid,
	}, {
		// overrides name validation to allow anything, because errand's name is randomly generated
		nameValidationRegex: /.*!/,
	});*/

	/* if (mid) {
		mentionMessage(errand._id, user, attachMessage(message, p_room));

		createErrandMessage(message.rid, user, errand._id, dsc, attachMessage(message, p_room));
	} else {
		createErrandMessage(prid, user, errand._id, dsc);
	}

	if (reply) {
		sendMessage(user, { msg: reply }, errand);
	}*/


	mentionMessage(mid, errand._id);

	return errand;
};

Meteor.methods({
	/**
	* Create errand by room or message
	* @constructor
	* @param {string} rid - Room Id - The room id.
	* @param {string} mid - Message Id - Create the errand by a message.
	* @param {string} dsc - description
	* @param {date} expired_at - expiration date
	* @param {Object} initiated_by - initiated user id
	* @param {Object} charged_to - charged user id
	* @param {string} reply - The reply, optional
	*/
	createErrand({ rid, mid, errandDescription, expired_at, initiated_by, charged_to, reply }) {
		if (!settings.get('Errand_enabled')) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a errand', { method: 'createErrand' });
		}

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'ErrandCreation' });
		}

		if (!hasAtLeastOnePermission(uid, ['start-errand', 'start-errand-other-user'])) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a errand', { method: 'createErrand' });
		}
		console.log('methods.createErrand');
		return create({ rid, mid, errandDescription, expired_at, initiated_by, charged_to, reply });
	},
});

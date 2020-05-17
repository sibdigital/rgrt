import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';
// import moment from 'moment';
import { Tracker } from 'meteor/tracker';

// eslint-disable-next-line import/order
import _ from 'underscore';
import moment from 'moment';

import { APIClient, t } from '../../../../utils/client';
import { call } from '../../../../ui-utils/client';
import './ErrandOnMessageDialog.html';

const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 500;


const getTimeZoneOffset = function() {
	const offset = new Date().getTimezoneOffset();
	const absOffset = Math.abs(offset);
	return `${ offset < 0 ? '+' : '-' }${ `00${ Math.floor(absOffset / 60) }`.slice(-2) }:${ `00${ absOffset % 60 }`.slice(-2) }`;
};

Template.ErrandOnMessageDialog.helpers({
	translateStatus(status) {
		return Template.instance().status_set[status];
	},
	errands() {
		return Template.instance().errands.get();
	},
	formatDate(date) {
		return moment(date).format('DD-MM-YYYY');
	},
});


Template.ErrandOnMessageDialog.events({
	'input #errand_name'(e, t) {
		t.errandDescription.set(e.target.value);
	},
	'input #errand_message'(e, t) {
		const { value } = e.target;
		t.reply.set(value);
	},

	'change [name=to__date]'(e, instance) {
		instance.expiredDate.set(e.target.value);
	},

	async 'submit #create-errand, click .js-save-errand'(event, instance) {
		event.preventDefault();


		// const parentChannel = instance.parentChannel.get();
		// const { pmid } = instance;
		const errandDescription = instance.errandDescription.get();

		const chargedUsers = instance.selectedUsers.get().map(({ username }) => username);
		const initiatedUsers = instance.initiatedByUsers.get().map(({ username }) => username);
		const { message } = instance;
		// const prid = instance.parentChannelId.get();
		const reply = instance.reply.get();


		// const result = await call('createErrand', { prid, pmid, t_name, reply, users });
		// // callback to enable tracking
		// callbacks.run('afterErrand', Meteor.user(), result);


		const { rid, _id: mid } = message;
		const initiated_by = initiatedUsers[0];
		const charged_to = chargedUsers[0];
		const expired_at = new Date(instance.expiredDate.get());


		if (!rid) {
			const errorText = TAPi18n.__('Invalid_room_name', `${ rid }...`);
			return toastr.error(errorText);
		}
		console.log('try to create errand');
		const result = await call('createErrand', { rid, mid, errandDescription, expired_at, initiated_by, charged_to, reply });
		// callback to enable tracking
		callbacks.run('afterErrand', Meteor.user(), result);

		if (instance.data.onCreate) {
			instance.data.onCreate(result);
		}
		// roomTypes.openRouteLink(result.t, result);
	},
});

Template.ErrandOnMessageDialog.onRendered(function() {
	/*Tracker.autorun(() => {
		const metaToDate = this.expiredDate.get();

		let toDate = new Date('9999-12-31T23:59:59Z');

		if (metaToDate) {
			toDate = new Date(`${ metaToDate }T00:00:00${ getTimeZoneOffset() }`);
		}


		if (toDate > new Date()) {
			return this.validate.set(t('Newer_than_may_not_exceed_Older_than', {
				postProcess: 'sprintf',
				sprintf: [],
			}));
		}
		this.validate.set('');
	});*/
});


Template.ErrandOnMessageDialog.onCreated(function() {
	// const { rid, message: msg } = this.data;

	// const parentRoom = rid && ChatSubscription.findOne({ rid });

	// if creating a errand from inside a errand, uses the same channel as parent channel
	/*	const room = parentRoom && parentRoom.prid ? ChatSubscription.findOne({ rid: parentRoom.prid }) : parentRoom;

	if (room) {
		room.text = room.name;
	}

	const roomName = room && roomTypes.getRoomName(room.t, room);*/

	this.errands = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);
	this.query = new ReactiveVar({});
	this.isLoading = new ReactiveVar(false);
	this.filter = new ReactiveVar('');

	this.status_set = {
		opened: TAPi18n.__('Status_Errand_Opened'),
		in_progress: TAPi18n.__('Status_Errand_In_Progress'),
		solved: TAPi18n.__('Status_Errand_Solved'),
		canceled: TAPi18n.__('Status_Errand_Canceled'),
		closed: TAPi18n.__('Status_Errand_Closed'),
	};

	const { errand } = this.data;

	this.onSuccessCallback = () => {
		this.offset.set(0);
		return this.loadErrands(this.query.get(), this.offset.get());
	};

	this.loadErrands = _.debounce(async (query, offset) => {
		this.isLoading.set(true);
		this.query.set({ _id: { $in: errand } });
		const { errands, total } = await APIClient.v1.get(`errands-on-message.list?count=${ 10 }&offset=${ offset }&query=${ JSON.stringify(query) }`);
		console.log('errands from server', errands);
		this.total.set(total);
		if (offset === 0) {
			this.errands.set(errands);
		} else {
			this.errands.set(this.errands.get().concat(errands));
		}
		this.isLoading.set(false);
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS);

	this.autorun(() => {
		const filter = this.filter.get() && this.filter.get().trim();
		const offset = this.offset.get();
		if (filter) {
			const regex = { $regex: filter, $options: 'i' };
			return this.loadErrands({ name: regex }, offset);
		}
		return this.loadErrands({ _id: { $in: errand } }, offset);
	});
});

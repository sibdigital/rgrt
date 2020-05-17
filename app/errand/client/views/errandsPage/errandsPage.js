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
import { call, modal } from '../../../../ui-utils/client';
import './errandsPage.html';

const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 500;


const getTimeZoneOffset = function() {
	const offset = new Date().getTimezoneOffset();
	const absOffset = Math.abs(offset);
	return `${ offset < 0 ? '+' : '-' }${ `00${ Math.floor(absOffset / 60) }`.slice(-2) }:${ `00${ absOffset % 60 }`.slice(-2) }`;
};

const descriptionMaxLength = 120;

Template.ErrandsPage.helpers({
	errands() {
		return Template.instance().errands.get();
	},
	formatDate(date) {
		return moment(date).format('DD-MM-YYYY');
	},
	errandType() {
		return Template.instance().type.get();
	},
	shortDescription(desc) {
		return desc.length > descriptionMaxLength ? `${ desc.substr(0, descriptionMaxLength) } ...` : desc;
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	errandsAreEmpty() {
		return Template.instance().errands.get().length === 0;
	},
});


Template.ErrandsPage.events({
	'input #errand_name'(e, t) {
		t.errandDescription.set(e.target.value);
	},

	'click .table-row'(e, target) {
		console.log(e.currentTarget.dataset);
		const { id, index } = e.currentTarget.dataset;
		let errand = target.errands.get();
		errand = _.findWhere(errand, {
			_id: id,
		});
		modal.open({
			title: t('Errand_details'),
			modifier: 'modal',
			content: 'ErrandDetails',
			data: {
				errand,
				updateRecord: target.updateRecord(Number(index)),
				onCreate() {
					modal.close();
				},
			},
			showConfirmButton: false,
			showCancelButton: false,
			confirmOnEnter: false,
		});
	},

	'input #errand_message'(e, t) {
		const { value } = e.target;
		t.reply.set(value);
	},

	'change [name=to__date]'(e, instance) {
		instance.expiredDate.set(e.target.value);
	},
});

Template.ErrandsPage.onRendered(function() {
	/* Tracker.autorun(() => {
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


Template.ErrandsPage.onCreated(function() {
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
	this.isLoading = new ReactiveVar(false);
	this.filter = new ReactiveVar('');

	this.type = new ReactiveVar(this.data.type && this.data.type() ? this.data.type() : 'all');

	this.updateRecord = (index) => (newRecord) => {
		const errands = this.errands.get();

		if (newRecord._id !== errands[index]._id) {
			console.log('Изменяется не тот объект!', 'Новый', newRecord._id, 'старый:', errands[index]._id);
		} else {
			errands[index] = newRecord;
			this.errands.set(errands);
		}
	};

	const userId = Meteor.userId();
	let errandQuerry = {};

	switch (this.type.get()) {
		case 'initiated_by_me':
			errandQuerry = { 'initiatedBy._id': `${ userId }` };
			break;
		case 'charged_to_me':
			errandQuerry = { 'chargedToUser._id': `${ userId }` };
			break;
	}
	this.query = new ReactiveVar(errandQuerry);


	this.onSuccessCallback = () => {
		this.offset.set(0);
		return this.loadErrands(this.query.get(), this.offset.get());
	};

	this.loadErrands = _.debounce(async (query, offset) => {
		this.isLoading.set(true);

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
		const newDataType = this.data.type && this.data.type() ? this.data.type() : 'all';
		if (this.type.get() !== newDataType) {
			let errandQuerry = {};
			this.isLoading.set(true);
			this.errands.set([]);
			const userId = Meteor.userId();
			this.type.set(this.data.type());
			switch (newDataType) {
				case 'initiated_by_me':
					errandQuerry = { 'initiatedBy._id': `${ userId }` };
					break;
				case 'charged_to_me':
					errandQuerry = { 'chargedToUser._id': `${ userId }` };
					break;
			}
			this.query.set(errandQuerry);
		}

		const filter = this.filter.get() && this.filter.get().trim();
		const offset = this.offset.get();
		if (filter) {
			const regex = { $regex: filter, $options: 'i' };
			return this.loadErrands({ name: regex }, offset);
		}
		return this.loadErrands(this.query.get(), offset);
	});
});

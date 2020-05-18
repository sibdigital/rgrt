import toastr from 'toastr';
import moment from 'moment';
import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { APIClient, t } from '../../../../utils/client';
import { callbacks } from '../../../../callbacks/client';
import { ChatRoom } from '../../../../models/client';
import { call } from '../../../../ui-utils/client';
import { AutoComplete } from '../../../../meteor-autocomplete/client';
import './ErrandDetails.html';
import { errandStatuses } from '../../../utils/statuses';


const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 500;

Template.ErrandDetails.helpers({

	disabled() {
		if (Template.instance().selectParent.get()) {
			return 'disabled';
		}
	},
	/*	targetChannelText() {
		const instance = Template.instance();
		const parentChannel = instance.parentChannel.get();
		return parentChannel && `${ TAPi18n.__('Errand_target_channel_prefix') } "${ parentChannel }"`;
	},*/
	createIsDisabled() {
		const { errand } = Template.instance();

		let dataIsTheSame = true;
		const chargedUsers = Template.instance().chargedUsers.get();
		const expired_at = moment(Template.instance().expiredDate.get(), moment.localeData().longDateFormat('L')).toDate();

		const description = Template.instance().errandDescription.get();
		try {
			if (chargedUsers && chargedUsers[0] && expired_at && description && description.trim()) {
				dataIsTheSame = dataIsTheSame && chargedUsers[0]._id === errand.chargedToUser._id;

				dataIsTheSame = dataIsTheSame && description === errand.desc;

				dataIsTheSame = dataIsTheSame && (errand.initiatedBy._id === Meteor.userId() || errand.chargedToUser._id === Meteor.userId());

				const status = Template.instance().status.get();
				dataIsTheSame = dataIsTheSame && status && status === errand.t;

				dataIsTheSame = dataIsTheSame && expired_at.valueOf() === errand.expireAt.getTime();
			}
		} catch (e) {
			console.log(e);
		}
		return dataIsTheSame ? 'disabled' : '';
	},

	isDisabled(condition) {
		return condition ? 'disabled' : '';
	},

	editIsDisabled() {
		const { errand } = Template.instance();
		return errand.initiatedBy._id === Meteor.userId() ? '' : 'disabled';
	},

	statusIsDisabled() {
		const { errand } = Template.instance();
		return errand.initiatedBy._id !== Meteor.userId() && errand.chargedToUser._id !== Meteor.userId() ? 'disabled' : '';
	},

	/* parentChannel() {
		const instance = Template.instance();
		return instance.parentChannel.get();
	},*/
	chargedUsers() {
		console.log('chargedUsers', Template.instance().chargedUsers.get());
		return Template.instance().chargedUsers.get().map((e) => e);
	},
	onSelectUser() {
		return Template.instance().onSelectUser;
	},
	onClickTagUser() {
		return Template.instance().onClickTagUser;
	},
	deleteLastItemUser() {
		return Template.instance().deleteLastItemUser;
	},

	initiatedByUsers() {
		const users = Template.instance().initiatedByUsers.get().map((e) => e);
		return users;
	},

	/*	onClickTagRoom() {
		return Template.instance().onClickTagRoom;
	},*/
	deleteLastItemRoom() {
		return Template.instance().deleteLastItemRoom;
	},

	selectedRoom() {
		return Template.instance().selectedRoom.get();
	},
	onSelectRoom() {
		return Template.instance().onSelectRoom;
	},
	roomCollection() {
		return ChatRoom;
	},
	roomSelector() {
		return (expression) => ({ name: { $regex: `.*${ expression }.*` } });
	},
	roomModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `#${ f.length === 0 ? text : text.replace(new RegExp(filter.get()), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	userModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `@${ f.length === 0 ? text : text.replace(new RegExp(filter.get()), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	errandDescription() {
		return Template.instance().errandDescription.get();
	},
	expiredDate() {
		return Template.instance().expiredDate.get();
	},
	createdDate() {
		return Template.instance().createdDate.get();
	},

	ejectUsername(user) {
		return Meteor.userId() === user._id ? TAPi18n.__('You') : user.username;
	},

	initiatedUser() {
		return Template.instance().initiatedByUsers.get();
	},
	chargedToUser() {
		return Template.instance().chargedUsers.get();
	},
	status() {
		return Template.instance().status.get();
	},
	statuses() {
		return errandStatuses;
	},
});


Template.ErrandDetails.events({
	'input #errand_description'(e, t) {
		t.errandDescription.set(e.target.value);
	},
	'input #errand_message'(e, t) {
		const { value } = e.target;
		t.reply.set(value);
	},

	'change [name=select_status]'(e, t) {
		t.status.set(e.target.value);
	},

	'change [name=expired__date]'(e, instance) {
		instance.expiredDate.set(e.target.value);
	},

	async 'submit #create-errand, click .js-save-errand'(event, instance) {
		event.preventDefault();

		const errandDescription = instance.errandDescription.get();
		try {
			instance.chargedUsers.get()[0];
		} catch (e) {
			const errorText = TAPi18n.__('Errand_Charged_to_cant_be_empty');
			return toastr.error(errorText);
		}
		const chargedUsers = instance.chargedUsers.get().map(({ _id, username, name }) => ({ _id, username, name }))[0];
		const status = instance.status.get();
		const expired_at = moment(instance.expiredDate.get(), moment.localeData().longDateFormat('L')).toDate();


		const { rid } = instance.errand;

		if (!rid) {
			const errorText = TAPi18n.__('Invalid_room_name', `${ rid }...`);
			return toastr.error(errorText);
		}

		/* newErrand.initiatedBy = {
			_id: initiatedUsers._id,
			username: initiatedUsers.username,
		};

		newErrand.chargedToUser = {
			_id: chargedUsers._id,
			username: chargedUsers.username,
		};

		newErrand.expireAt = expired_at;
		newErrand.desc = errandDescription;
		newErrand.t = status;*/
		console.log('submit', instance.errand)
		const result = await call('editErrand', { _id: instance.errand._id, chargedUsers, errandDescription, expired_at, status });
		// callback to enable tracking
		// callbacks.run('afterErrand', Meteor.user(), result);
		console.log('result', result);
		if (instance.data.updateRecord) {
			instance.data.updateRecord(result);
		}

		if (instance.data.onCreate) {
			instance.data.onCreate();
		}
		// roomTypes.openRouteLink(result.t, result);
	},
});

Template.ErrandDetails.onRendered(function() {
	this.$('#expired_date').datepicker({
		autoclose: true,
		todayHighlight: true,
		format: moment.localeData().longDateFormat('L').toLowerCase(),
		changeMonth: true,
		changeYear: true,
	});


	this.$('#expired_date').datepicker('setDate', Template.instance().expiredDate.get());

	this.$('#started_date').datepicker({
		autoclose: true,
		todayHighlight: true,
		format: moment.localeData().longDateFormat('L').toLowerCase(),
		changeMonth: true,
		changeYear: true,
	});


	this.$('#started_date').datepicker('setDate', Template.instance().createdDate.get());
});


Template.ErrandDetails.onCreated(function() {
	this.errand = this.data.errand;
	console.log('onCreated', this.errand);

	this.errandDescription = new ReactiveVar(this.errand.desc);

	this.errand.expireAt = new Date(this.errand.expireAt);
	this.expiredDate = new ReactiveVar(this.errand.expireAt);
	this.createdDate = new ReactiveVar(new Date(this.errand.ts));
	this.status = new ReactiveVar(this.errand.t);

	this.chargedUsers = new ReactiveVar([]);
	this.getUserById = _.debounce(async (_id) => {
		const query = {
			_id,
		};
		const url = `users.list?count=${ 1 }&offset=${ 0 }&query=${ JSON.stringify(query) }`;
		const { users } = await APIClient.v1.get(url);
		this.chargedUsers.set(users);
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS);
	this.getUserById(this.errand.chargedToUser._id);
	this.initiatedByUsers = new ReactiveVar(this.errand.initiatedBy);


	this.onSelectUser = ({ item: user }) => {
		this.chargedUsers.set([user]);
	};
	this.onClickTagUser = ({ username }) => {
		this.chargedUsers.set(this.chargedUsers.get().filter((user) => user.username !== username));
	};
	this.deleteLastItemUser = () => {
		this.chargedUsers.set([]);
	};


	// callback to allow setting a parent Channel or e. g. tracking the event using Piwik or GA
	const { parentChannel, reply } = callbacks.run('openErrandCreationScreen') || {};

	if (parentChannel) {
		this.parentChannel.set(parentChannel);
	}
	if (reply) {
		this.reply.set(reply);
	}


	/* this.autorun(() => {
		this.errand = this.data.errand;

		this.errandDescription.set(this.errand.desc);
		this.expiredDate.set(new Date(this.errand.expireAt));
		this.createdDate.set(new Date(this.errand.ts));
		this.status.set(this.errand.t);

		this.selectedUsers = new ReactiveVar(this.getUserById(this.errand.chargedToUser._id));
		this.initiatedByUsers.set(this.errand.initiatedBy);
	});*/
});


Template.SearchUsersForErrandDetails.helpers({
	list() {
		return this.list;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
	config() {
		const { filter } = Template.instance();
		const { noMatchTemplate, templateItem, modifier } = Template.instance().data;
		return {
			filter: filter.get(),
			template_item: templateItem,
			noMatchTemplate,
			modifier(text) {
				return modifier(filter, text);
			},
		};
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
});

Template.SearchUsersForErrandDetails.events({
	'input input'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const { length } = input.value;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);
		t.filter.set(input.value);
	},
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'keydown input'(e, t) {
		t.ac.onKeyDown(e);
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const { deleteLastItem } = t;
			return deleteLastItem && deleteLastItem();
		}
	},
	'keyup input'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus input'(e, t) {
		t.ac.onFocus(e);
	},
	'blur input'(e, t) {
		t.ac.onBlur(e);
	},
	'click .rc-tags__tag'({ target }, t) {
		const { onClickTag } = t;
		return onClickTag & onClickTag(Blaze.getData(target));
	},
});

Template.SearchUsersForErrandDetails.onRendered(function() {
	const { name } = this.data;
	this.ac.element = this.firstNode.querySelector(`[name=${ name }]`);
	this.ac.$element = $(this.ac.element);
});

Template.SearchUsersForErrandDetails.onCreated(function() {
	this.filter = new ReactiveVar('');
	this.selected = new ReactiveVar([]);
	this.onClickTag = this.data.onClickTag;
	this.deleteLastItem = this.data.deleteLastItem;
	const { collection, endpoint, field, sort, onSelect, selector = (match) => ({ term: match }) } = this.data;
	this.ac = new AutoComplete(
		{
			selector: {
				anchor: '.rc-input__label',
				item: '.rc-popup-list__item',
				container: '.rc-popup-list__list',
			},
			onSelect,
			position: 'fixed',
			limit: 10,
			inputDelay: 300,
			rules: [
				{
					collection,
					endpoint,
					field,
					matchAll: true,
					// filter,
					doNotChangeWidth: false,
					selector,
					sort,
				},
			],

		});
	this.ac.tmplInst = this;
});

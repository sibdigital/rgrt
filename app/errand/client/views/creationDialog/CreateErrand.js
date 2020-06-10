import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';
import moment from 'moment';
import { Tracker } from 'meteor/tracker';

// eslint-disable-next-line import/order
import { t } from '../../../../utils/client';

// import { roomTypes, t } from '../../../../utils/client';
import { callbacks } from '../../../../callbacks/client';
import { ChatRoom } from '../../../../models/client';
import { call } from '../../../../ui-utils/client';
import { AutoComplete } from '../../../../meteor-autocomplete/client';

import './CreateErrand.html';


const getTimeZoneOffset = function() {
	const offset = new Date().getTimezoneOffset();
	const absOffset = Math.abs(offset);
	return `${ offset < 0 ? '+' : '-' }${ `00${ Math.floor(absOffset / 60) }`.slice(-2) }:${ `00${ absOffset % 60 }`.slice(-2) }`;
};

Template.CreateErrand.helpers({

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
		const { errandDescription, expiredDate, initiatedByUsers, selectedUsers } = Template.instance();
		console.log(errandDescription.get().trim(), expiredDate.get(), initiatedByUsers.get(), selectedUsers.get());
		return errandDescription.get().trim().length !== 0 && expiredDate.get() && initiatedByUsers.get().length !== 0 && selectedUsers.get().length !== 0 ? '' : 'disabled';
	},
	/* parentChannel() {
		const instance = Template.instance();
		return instance.parentChannel.get();
	},*/
	selectedUsers() {
		return Template.instance().selectedUsers.get().map((e) => e);
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

	onClickInitiatedTagUser() {
		return Template.instance().onClickInitiatedTagUser;
	},
	deleteLastInitiatedItemUser() {
		return Template.instance().deleteLastInitiatedItemUser;
	},

	onSelectInitiatedUser() {
		return Template.instance().onSelectInitiatedUser;
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
});


Template.CreateErrand.events({
	'input #errand_description'(e, t) {
		t.errandDescription.set(e.target.value);
	},
	'input #errand_message'(e, t) {
		const { value } = e.target;
		t.reply.set(value);
	},

	'change [name=expired__date]'(e, instance) {
		instance.expiredDate.set(e.target.value);
	},

	async 'submit #create-errand, click .js-save-errand'(event, instance) {
		event.preventDefault();

		const errandDescription = instance.errandDescription.get();

		const chargedUsers = instance.selectedUsers.get();
		const initiatedUsers = instance.initiatedByUsers.get();
		const { message } = instance;

		const reply = instance.reply.get();


		const { rid, _id: mid } = message;
		const initiated_by = initiatedUsers[0];
		const charged_to = chargedUsers[0];
		const expired_at = moment(instance.expiredDate.get(), moment.localeData().longDateFormat('L')).toDate();


		if (!rid) {
			const errorText = TAPi18n.__('Invalid_room_name', `${ rid }...`);
			return toastr.error(errorText);
		}
		const result = await call('createErrand', { rid, mid, errandDescription, expired_at, initiated_by, charged_to, reply });
		// callback to enable tracking
		callbacks.run('afterErrand', Meteor.user(), result);

		if (instance.data.onCreate) {
			instance.data.onCreate(result);
		}
		// roomTypes.openRouteLink(result.t, result);
	},
});

Template.CreateErrand.onRendered(function() {
	this.find('#usersCharged').focus();

	this.$('#expired_date').datepicker({
		autoclose: true,
		todayHighlight: true,
		format: moment.localeData().longDateFormat('L').toLowerCase(),
		changeMonth: true,
		changeYear: true,
	});


	this.$('#expired_date').datepicker('setDate', Template.instance().expiredDate.get());
});

const suggestName = (msg = '') => msg.substr(0, 140);

Template.CreateErrand.onCreated(function() {
	const { message: msg } = this.data;
	this.message = msg;

	this.errandDescription = new ReactiveVar(suggestName(msg && msg.msg));
	this.expiredDate = new ReactiveVar(new Date());

	this.pmid = msg && msg._id;

	this.reply = new ReactiveVar('');

	this.selectedUsers = new ReactiveVar([]);

	this.onSelectUser = ({ item: user }) => {
		this.selectedUsers.set([user]);
	};
	this.onClickTagUser = ({ username }) => {
		this.selectedUsers.set(this.selectedUsers.get().filter((user) => user.username !== username));
	};
	this.deleteLastItemUser = () => {
		this.selectedUsers.set([]);
	};


	this.initiatedByUsers = new ReactiveVar([]);
	if (msg) {
		this.initiatedByUsers.get().unshift(msg.u);
	}

	this.onSelectInitiatedUser = ({ item: user }) => {
		this.initiatedByUsers.set([user]);
	};
	this.onClickInitiatedTagUser = ({ username }) => {
		this.initiatedByUsers.set(this.initiatedByUsers.get().filter((user) => user.username !== username));
	};
	this.deleteLastInitiatedItemUser = () => {
		this.initiatedByUsers.set([]);
	};
});

Template.SearchCreateErrand.helpers({
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

Template.SearchCreateErrand.events({
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

Template.SearchCreateErrand.onRendered(function() {
	const { name } = this.data;
	this.ac.element = this.firstNode.querySelector(`[name=${ name }]`);
	this.ac.$element = $(this.ac.element);
});

Template.SearchCreateErrand.onCreated(function() {
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

import toastr from 'toastr';
import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { t, roomTypes, handleError } from '../../../../utils';
import { TabBar, fireGlobalEvent, call } from '../../../../ui-utils';
import { ChatSubscription, Rooms, ChatRoom } from '../../../../models';
import { settings } from '../../../../settings';
import { emoji } from '../../../../emoji';
import { Markdown } from '../../../../markdown/client';
import { hasAllPermission } from '../../../../authorization';
import { getUidDirectMessage } from '../../../../ui-utils/client/lib/getUidDirectMessage';

import './headerErrand.html';

const getUserStatus = (id) => {
	const roomData = Session.get(`roomData${ id }`);
	return roomTypes.getUserStatus(roomData.t, id);
};

const getUserStatusText = (id) => {
	const roomData = Session.get(`roomData${ id }`);
	return roomTypes.getUserStatusText(roomData.t, id);
};

Template.headerErrand.helpers({
	back() {
		return Template.instance().data.back;
	},
	avatarBackground() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }
		return roomTypes.getConfig(roomData.t).getAvatarPath(roomData);
	},
	buttons() {
		return TabBar.getButtons();
	},

	isTranslated() {
		const sub = ChatSubscription.findOne({ rid: this._id }, { fields: { autoTranslate: 1, autoTranslateLanguage: 1 } });
		return settings.get('AutoTranslate_Enabled') && ((sub != null ? sub.autoTranslate : undefined) === true) && (sub.autoTranslateLanguage != null);
	},
	roomName() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }

		return roomTypes.getRoomName(roomData.t, roomData);
	},

	secondaryName() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }

		return roomTypes.getSecondaryRoomName(roomData.t, roomData);
	},


	fixedHeight() {
		return Template.instance().data.fixedHeight;
	},

	fullpage() {
		return Template.instance().data.fullpage;
	},

	roomIcon() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!(roomData != null ? roomData.t : undefined)) { return ''; }

		return roomTypes.getIcon(roomData);
	},

});

Template.headerErrand.events({
	// 'click .iframe-toolbar .js-iframe-action'(e) {
	// 	fireGlobalEvent('click-toolbar-button', { id: this.id });
	// 	e.currentTarget.querySelector('button').blur();
	// 	return false;
	// },
	//
	// 'click .js-favorite'(event, instance) {
	// 	event.stopPropagation();
	// 	event.preventDefault();
	// 	event.currentTarget.blur();
	//
	// 	return Meteor.call(
	// 		'toggleFavorite',
	// 		this._id,
	// 		!instance.state.get('favorite'),
	// 		(err) => err && handleError(err),
	// 	);
	// },
	//
	// 'click .js-open-parent-channel'(event, t) {
	// 	event.preventDefault();
	// 	const { prid } = t.currentChannel;
	// 	FlowRouter.goToRoomById(prid);
	// },
	// 'click .js-toggle-encryption'(event) {
	// 	event.stopPropagation();
	// 	event.preventDefault();
	// 	const room = ChatRoom.findOne(this._id);
	// 	if (hasAllPermission('edit-room', this._id)) {
	// 		call('saveRoomSettings', this._id, 'encrypted', !(room && room.encrypted)).then(() => {
	// 			toastr.success(
	// 				t('Encrypted_setting_changed_successfully'),
	// 			);
	// 		});
	// 	}
	// },
});



Template.headerErrand.onCreated(function() {
	this.state = new ReactiveDict();

	this.autorun(() => {
		const { _id: rid } = Template.currentData();

		this.state.set({
			rid,
			discussion: isDiscussion(rid),
		});

	});

});

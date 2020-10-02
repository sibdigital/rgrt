import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';

import { Messages } from '../../../models/client';
import { APIClient } from '../../../utils/client';

import './ErrandTabbar.html';
import moment from 'moment';

import { timeAgo, formatDateAndTime } from '../../../lib/client/lib/formatDate';
import { DateFormat } from '../../../lib/client';

const LIMIT_DEFAULT = 50;


Template.errandsTabbar.helpers({
	hasErrands() {
		return Template.instance().messages.find().count();
	},
	errands() {
		return Template.instance().errands.get();
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},

});

Template.errand.helpers({
	formatDateAndTime,
	time() {
		const { err, timeAgo: useTimeAgo } = this;
		return useTimeAgo ? timeAgo(err.ts) : DateFormat.formatTime(err.ts);
	},
	date() {
		const { err } = this;
		return DateFormat.formatDate(err.ts);
	},
	formatDate(date) {
		return moment(date).format(moment.localeData().longDateFormat('L'));
	},
});

Template.errandsTabbar.onCreated(function() {
	this.rid = this.data.rid;
	this.messages = new Mongo.Collection(null);
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(LIMIT_DEFAULT);
	this.errands = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.query = new ReactiveVar({});

	this.autorun(() => {
		const query = {
			rid: this.rid,
			errand: { $exists: true },
		};

		this.cursor && this.cursor.stop();

		this.limit.set(LIMIT_DEFAULT);

		this.cursor = Messages.find(query).observe({
			added: ({ _id, ...message }) => {
				this.messages.upsert({ _id }, message);
			},
			changed: ({ _id, ...message }) => {
				this.messages.upsert({ _id }, message);
			},
			removed: ({ _id }) => {
				this.messages.remove({ _id });
			},
		});
	});

	this.autorun(async () => {
		const limit = this.limit.get();
		const { messages } = await APIClient.v1.get(`chat.getDiscussionsWithErrands?roomId=${ this.rid }&count=${ limit }`);
		const errandsId = [];
		for (const message of messages) {
			for (let i = 0; i < message.errand.length; i++) {
				errandsId.push(message.errand[i]);
			}
		}
		const offset = this.offset.get();
		const { errands, total } = await APIClient.v1.get(`errands-on-message.list?count=${ LIMIT_DEFAULT }&offset=${ offset }&query=${ JSON.stringify({ _id: { $in: errandsId } }) }`);
		if (offset === 0) {
			this.errands.set(errands);
		} else {
			this.errands.set(this.errands.get().concat(errands));
		}
		this.hasMore.set(total > limit);
	});
});

Template.errandsTabbar.events({
	'scroll .js-list': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight - 10 && instance.hasMore.get()) {
			instance.offset.set(instance.offset.get() + LIMIT_DEFAULT);
			instance.limit.set(instance.limit.get() + LIMIT_DEFAULT);
		}
	}, 200),
});

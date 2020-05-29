import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import _ from 'underscore';

import { API } from '../api';
import { findErrands } from '../lib/errands';

import { saveCustomFields, saveUser } from '/app/lib';

import { Errands, Users } from '../../../models/server';


API.v1.addRoute('errands-on-message.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findErrands({
			query,
			options: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('errands', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		if (sort && Object.keys(sort).length > 1) {
			return API.v1.failure('This method support only one "sort" parameter');
		}

		const userId = Meteor.userId();

		const formedQuery = {};

		switch (query.type) {
			case 'initiated_by_me':
				formedQuery['initiatedBy._id'] = `${ userId }`;
				break;
			case 'charged_to_me':
				formedQuery['chargedToUser._id'] = `${ userId }`;
				break;
		}

		if (query.mid) {
			formedQuery.mid = `${ query.mid }`;
		}

		if (query._id) {
			formedQuery._id = query._id;
		}

		const sortBy = sort ? Object.keys(sort)[0] : 'ts';
		const sortDirection = sort && Object.values(sort)[0] === 1 ? 'asc' : 'desc';

		const result = Meteor.runAsUser(this.userId, () => Meteor.call('browseErrands', {
			query: formedQuery,
			sortBy,
			sortDirection,
			offset: Math.max(0, offset),
			limit: Math.max(0, count),
		}));

		if (!result) {
			return API.v1.failure('Please verify the parameters');
		}
		return API.v1.success({
			result: result.results,
			count: result.results.length,
			offset,
			total: result.total,
		});
	},
});

API.v1.addRoute('errands.update', { authRequired: true }, {
	post() {
		/* check(this.bodyParams, {
			data: Match.ObjectIncluding({
				email: Match.Maybe(String),
				name: Match.Maybe(String),
				password: Match.Maybe(String),
				username: Match.Maybe(String),
				bio: Match.Maybe(String),
				statusText: Match.Maybe(String),
				active: Match.Maybe(Boolean),
				roles: Match.Maybe(Array),
				joinDefaultChannels: Match.Maybe(Boolean),
				requirePasswordChange: Match.Maybe(Boolean),
				sendWelcomeEmail: Match.Maybe(Boolean),
				verified: Match.Maybe(Boolean),
				customFields: Match.Maybe(Object),
			}),
		});*/


		const formedQuery = this.bodyParams;
		if (formedQuery.chargedToUser) {
			formedQuery.chargedToUser = Users.findOne({ _id: formedQuery.chargedToUser }, {
				fields: {
					_id: 1,
					username: 1,
					name: 1,
				},
			});
		}

		const oldErrand = Errands.findOne({ _id: formedQuery._id });

		const newErrand = { ...oldErrand, ...formedQuery };



		Meteor.runAsUser(this.userId, () => Meteor.call('editErrand', {
			_id: newErrand._id,
			chargedUsers: newErrand.chargedToUser,
			errandDescription: newErrand.desc,
			expired_at: newErrand.expireAt,
			status: newErrand.t }));


		return API.v1.success({ errand: Errands.findOne({ _id: formedQuery._id }) });
	},
});

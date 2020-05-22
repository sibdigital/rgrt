import { Meteor } from 'meteor/meteor';

import { API } from '../api';
import { findErrands } from '../lib/errands';


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

import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import s from 'underscore.string';

import { hasPermission } from '../../app/authorization';
import { Errands, Rooms, Users } from '../../app/models';
import { settings } from '../../app/settings/server';
import { getFederationDomain } from '../../app/federation/server/lib/getFederationDomain';
import { isFederationEnabled } from '../../app/federation/server/lib/isFederationEnabled';
import { federationSearchUsers } from '../../app/federation/server/handler';

/* const sortChannels = function(field, direction) {
	switch (field) {
		case 'createdAt':
			return {
				ts: direction === 'asc' ? 1 : -1,
			};
		case 'lastMessage':
			return {
				'lastMessage.ts': direction === 'asc' ? 1 : -1,
			};
		default:
			return {
				[field]: direction === 'asc' ? 1 : -1,
			};
	}
};

const sortUsers = function(field, direction) {
	switch (field) {
		case 'email':
			return {
				'emails.address': direction === 'asc' ? 1 : -1,
				username: direction === 'asc' ? 1 : -1,
			};
		default:
			return {
				[field]: direction === 'asc' ? 1 : -1,
			};
	}
};*/

Meteor.methods({
	browseErrands({ query, sortBy = 'ts', sortDirection = 'asc', page, offset, limit = 10 }) {
		/* const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');

		if (!['channels', 'users'].includes(type)) {
			return;
		}

		if (!['asc', 'desc'].includes(sortDirection)) {
			return;
		}

		if ((!page && page !== 0) && (!offset && offset !== 0)) {
			return;
		}

		if (!['name', 'createdAt', 'usersCount', ...type === 'channels' ? ['usernames', 'lastMessage'] : [], ...type === 'users' ? ['username', 'email', 'bio'] : []].includes(sortBy)) {
			return;
		}*/

		const skip = Math.max(0, offset || (page > -1 ? limit * page : 0));

		limit = limit > 0 ? limit : 10;

		const pagination = {
			skip,
			limit,
		};

		const canViewAnonymous = settings.get('Accounts_AllowAnonymousRead') === true;

		const user = Meteor.user();

		/*	if (type === 'channels') {
			const sort = sortChannels(sortBy, sortDirection);
			if ((!user && !canViewAnonymous) || (user && !hasPermission(user._id, 'view-c-room'))) {
				return;
			}

			const result = Rooms.findByNameOrFNameAndType(regex, 'c', {
				...pagination,
				sort: {
					featured: -1,
					...sort,
				},
			});

			return {
				total: result.count(), // count ignores the `skip` and `limit` options
				results: result.fetch(),
			};
		}

		// non-logged id user
		if (!user) {
			return;
		}*/

		// type === users
		if (!hasPermission(user._id, 'view-outside-room') || !hasPermission(user._id, 'view-d-room')) {
			return;
		}

		const options = {
			...pagination,
			sort: { [sortBy]: sortDirection === 'asc' ? 1 : -1 },
		};

		const result = Errands.find(query, options);


		const total = result.count(); // count ignores the `skip` and `limit` options
		const results = result.fetch();

		return {
			total,
			results,
		};
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'browseErrands',
	userId(/* userId*/) {
		return true;
	},
}, 100, 100000);

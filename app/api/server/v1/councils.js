import { API } from '../api';
import { findCouncils, findOneCouncil, findCouncil, findOneCouncilByInviteLink } from '../lib/councils';
import { hasPermission } from '../../../authorization';
import { Users } from '../../../models';

API.v1.addRoute('councils.list', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-c-room')) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findCouncils({
			query,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('councils.getOne', { authRequired: false }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findOneCouncil(query._id)));
	},
});

API.v1.addRoute('councils.getOneByInviteLink', { authRequired: false }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findOneCouncilByInviteLink(query.inviteLink)));
	},
});

API.v1.addRoute('councils.findOne', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findCouncil(query._id)));
	},
});

API.v1.addRoute('councils.invitedUsers', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-c-room')) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const council = Promise.await(findCouncil(query.$and[1]._id));
		// console.log(council);
		// console.log('kek');
		// console.log(query);
		// console.log(query.$and);
		// console.log(query.$and[1]._id);

		const users = Users.find({ _id: { $in: council.invitedUsers.map((user) => typeof user === typeof {} ? user._id : user ) } }, {
		// const users = Users.find({ _id: { $in: council.invitedUsers } }, {
			sort: sort || { username: 1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch().map((user) => { 
			const iUser = council.invitedUsers.find((iUser) => (typeof iUser === typeof {} && iUser._id === user._id) || (typeof iUser === typeof '' && iUser === user._id));
			if (!iUser) { return; }
			if (!iUser.ts) {
				user.ts = new Date('January 1, 2021 00:00:00');
			} else {
				user.ts = iUser.ts;
			}
			return user;
		});

		return API.v1.success({
			invitedUsers: users,
			count: users.length,
			offset,
			total: Users.find({ _id: { $in: council.invitedUsers } }).count(),
		});
	},
});

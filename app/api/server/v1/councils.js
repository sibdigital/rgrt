import { API } from '../api';
import { findCouncils, findOneCouncil, findCouncil, findOneCouncilByInviteLink } from '../lib/councils';
import { hasPermission } from '../../../authorization';

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

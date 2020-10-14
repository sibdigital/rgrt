import { API } from '../api';
import { findWorkingGroups, findOneWorkingGroup, findWorkingGroup } from '../lib/working-groups';

API.v1.addRoute('working-groups.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findWorkingGroups({
			query,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('working-group.getOne', { authRequired: false }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findOneWorkingGroup(query._id)));
	},
});

API.v1.addRoute('working-group.findOne', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findWorkingGroup(query._id)));
	},
});


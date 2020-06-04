import { API } from '../api';
import { findCouncils } from '../lib/councils';

API.v1.addRoute('councils.list', { authRequired: true }, {
	get() {
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

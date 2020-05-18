import { API } from '../api';
import { findErrandsOnMessage } from '../lib/errands';

API.v1.addRoute('errands-on-message.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findErrandsOnMessage({
			query,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

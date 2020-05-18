import { API } from '../api';
import { findTags } from '../lib/tags';

API.v1.addRoute('tags.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findTags({
			query,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

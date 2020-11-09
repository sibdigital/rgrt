import { API } from '../api';
import { findProtocols, findProtocol } from '../lib/protocols';
import { hasPermission } from '../../../authorization';

API.v1.addRoute('protocols.list', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'manage-protocols')) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findProtocols({
			query,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('protocols.findOne', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findProtocol(query._id)));
	},
});

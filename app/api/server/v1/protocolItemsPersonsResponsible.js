import { API } from '../api';
import { findProtocolItemsPersonsResponsible } from '../lib/protocolItemsPersonsResponsible';

API.v1.addRoute('protocolItemsPersonsResponsible.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query, stockFields } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findProtocolItemsPersonsResponsible({
			query,
			fields: stockFields,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

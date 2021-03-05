import { API } from '../api';
import { findPersons, findPerson } from '../lib/persons';

API.v1.addRoute('persons.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query, stockFields } = this.parseJsonQuery();

		if (query.isAllow) {
			API.v1.success({
				persons: [],
				count: 0,
				offset: 0,
				total: 0,
			});
		}

		return API.v1.success(Promise.await(findPersons({
			query,
			pagination: {
				offset,
				count,
				sort,
			},
			fields: stockFields,
		})));
	},
});

API.v1.addRoute('persons.listToAutoComplete', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findPersons({
			query,
			fields: { surname: 1, name: 1, patronymic: 1, userId: 1 },
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('persons.findOne', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findPerson(query._id)));
	},
});

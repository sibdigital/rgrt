import { API } from '../api';
import { findAgendas, findAgenda, findByCouncilId } from '../lib/agendas';

API.v1.addRoute('agendas.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findAgendas({
			query,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('agendas.findOne', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findAgenda(query._id)));
	},
});

API.v1.addRoute('agendas.findByCouncilId', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		const cursor = Promise.await(findByCouncilId(query.councilId));
		if (cursor) {
			return API.v1.success(cursor);
		} else {
			return API.v1.failure('Повестка связанная с мероприятием не найдена');
		}
	},
});

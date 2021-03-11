import { API } from '../api';
import { findAgendas, findAgenda, findByCouncilId, getNumberCount } from '../lib/agendas';
import { findOneCouncilByInviteLink } from '../lib/councils';
import { Agendas } from '../../../models';

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
		const { query, stockFields } = this.parseJsonQuery();

		const cursor = Promise.await(findByCouncilId(query.councilId, { fields: stockFields }));
		return API.v1.success(cursor ?? {});
	},
});

API.v1.addRoute('agendas.findByCouncilInviteLink', { authRequired: false }, {
	get() {
		const { query, fields } = this.parseJsonQuery();
		console.log(fields);
		const fieldsAfterDelete = this.deleteDefaultFieldsToExclude(fields);
		console.log(fieldsAfterDelete);

		const council = Promise.await(findOneCouncilByInviteLink(query.inviteLink, { fields }));

		if (!council && council._id) {
			return API.v1.failure('Not Found');
		}

		const cursor = Promise.await(findByCouncilId(council._id, { fields }));
		if (cursor) {
			return API.v1.success(cursor);
		} else {
			return API.v1.success({ request: null });
		}
	},
});

API.v1.addRoute('agendas.proposals', { authRequired: true }, {
	get() {
		const { query, fields } = this.parseJsonQuery();
		const nonSelectableFields = Object.keys(API.v1.defaultFieldsToExclude);

		Object.keys(fields).forEach((k) => {
			if (nonSelectableFields.includes(k) || nonSelectableFields.includes(k.split(API.v1.fieldSeparator)[0])) {
				delete fields[k];
			}
		});

		const cursor = Promise.await(findByCouncilId(query.councilId, { fields }));

		return API.v1.success(cursor);
	},
});

API.v1.addRoute('agendas.proposalsByUser', { authRequired: true }, {
	get() {
		const { query, stockFields } = this.parseJsonQuery();

		let cursor = Promise.await(findByCouncilId(query.councilId, { fields: stockFields }));
		const res = [];

		if (!cursor) {
			const createAgenda = {
				name: '',
				number: '',
				councilId: query.councilId,
			};
			Agendas.create(createAgenda);

			cursor = Promise.await(findByCouncilId(query.councilId, { fields: stockFields }));
		}

		if (cursor.proposals) {
			cursor.proposals.forEach((proposal) => { proposal.initiatedBy._id === query.userId && res.push(proposal); });
		}
		return API.v1.success({ _id: cursor._id, proposals: res });
	},
});

API.v1.addRoute('agendas.numberCount', { authRequired: true }, {
	get() {
		const cursor = Promise.await(getNumberCount());
		return API.v1.success({ numberCount: cursor.numberCount ? cursor.numberCount + 1 : 1 });
	},
});

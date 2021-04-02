import { API } from '../api';
import { findProtocols, findProtocol, findProtocolByCouncilId, findProtocolByItemId } from '../lib/protocols';
import { hasPermission } from '../../../authorization';
import { Persons } from '../../../models';

API.v1.addRoute('protocols.list', { authRequired: true }, {
	get() {
		// if (!hasPermission(this.userId, 'manage-protocols')) {
		// 	return API.v1.unauth1orized();
		// }

		const { offset, count } = this.getPaginationItems();
		const { sort, query, stockFields } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findProtocols({
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

API.v1.addRoute('protocols.list.requestAnswer', { authRequired: false }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findProtocols({
			query,
			fields: {
				sections: 1,
				num: 1,
				place: 1,
				d: 1,
			},
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
		const { query, stockFields } = this.parseJsonQuery();
		const cursor = Promise.await(findProtocol(query._id, { fields: stockFields ?? {} }));
		return API.v1.success(cursor ?? {});
	},
});

API.v1.addRoute('protocols.findByItemId', { authRequired: true }, {
	get() {
		const { query, stockFields } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findProtocolByItemId(query._id, { fields: stockFields ?? {} })));
	},
});

API.v1.addRoute('protocols.findByCouncilId', {authRequired: true}, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findProtocolByCouncilId(query._id)))
	}
});

API.v1.addRoute('protocols.participants', { authRequired: true }, {
	get() {
		// if (!hasPermission(this.userId, 'manage-protocols')) {
		// 	return API.v1.unauthorized();
		// }

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const protocol = Promise.await(findProtocol(query._id));

		const users = Persons.find({ _id: { $in: protocol.participants } }, {
			sort: sort || { username: 1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();

		return API.v1.success({
			users,
			count: users.length,
			offset,
			total: Persons.find({ _id: { $in: protocol.participants } }).count(),
		});
	},
});

API.v1.addRoute('protocols.allParticipants', { authRequired: true }, {
	get() {
		const { sort, fields, query } = this.parseJsonQuery();

		const protocol = Promise.await(findProtocol(query._id));

		const users = Persons.find({ _id: { $in: protocol.participants } }, {
			sort: sort || { username: 1 },
			fields,
		}).fetch();

		return API.v1.success({
			users,
			count: users.length,
		});
	},
});

API.v1.addRoute('protocols.getProtocolItemsByItemsId', { authRequired: true }, {
	get() {
		// const { offset, count } = this.getPaginationItems();
		const { query } = this.parseJsonQuery();

		const cursor = Promise.await(findProtocol(query._id));
		console.log({ cursor, query });
		const items = [];

		if (!cursor) {
			return API.v1.success({ items });
		}

		if (cursor.sections && query.protocolItemsId && query.protocolItemsId.length > 0) {
			cursor.sections.forEach((section) => section.items?.forEach((item) => query.protocolItemsId.some((id) => id === item._id) && items.push({ _id: item._id, num: item.num, expireAt: item.expireAt, name: item.name, responsible: item.responsible })));
		}
		console.log({ items });

		return API.v1.success({ items });
	},
});

API.v1.addRoute('protocols.getProtocolItemsByProtocolId', { authRequired: true }, {
	get() {
		// const { offset, count } = this.getPaginationItems();
		const { query } = this.parseJsonQuery();

		const cursor = Promise.await(findProtocol(query._id));
		console.log({ cursor, query });
		const items = [];

		if (!cursor) {
			return API.v1.success({ items });
		}

		if (cursor.sections) {
			cursor.sections.forEach((section) => section.items?.forEach((item) =>
				(!query.protocolItems || query.protocolItems.length === 0 || !query.protocolItems?.some((protocolItem) => (item._id === protocolItem._id || item._id === protocolItem)))
				&& items.push({ _id: item._id, sectionId: section._id, num: item.num, expireAt: item.expireAt, name: item.name, responsible: item.responsible })
			));
		}
		// console.log({ items });

		return API.v1.success({ items });
	},
});

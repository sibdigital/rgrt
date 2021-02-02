import { API } from '../api';
import { findProtocols, findProtocol } from '../lib/protocols';
import { hasPermission } from '../../../authorization';
import { Users, Persons } from '../../../models';

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
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findProtocol(query._id)));
	},
});

API.v1.addRoute('protocols.participants', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'manage-protocols')) {
			return API.v1.unauthorized();
		}

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

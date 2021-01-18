import { API } from '../api';
import { findPersons, findPerson } from '../lib/persons';

API.v1.addRoute('persons.list', { authRequired: true }, {
	get() {
		console.log('hatlist');
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findPersons({
			query,
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

// API.v1.addRoute('persons.createParticipant', { authRequired: true }, {
// 	post() {
// 		console.log('users.createParticipant start');
// 		console.log(this.bodyParams);
// 		// check(this.bodyParams, {
// 		// 	email: String,
// 		// 	name: String,
// 		// 	surname: String,
// 		// 	patronymic: String,
// 		// 	organization: Match.Maybe(String),
// 		// 	position: Match.Maybe(String),
// 		// 	phone: Match.Maybe(String),
// 		// 	// workingGroup: Match.Maybe(String),
// 		// });

// 		const newUserId = saveParticipant(this.userId, this.bodyParams);

// 		const { fields } = this.parseJsonQuery();

// 		console.log(newUserId);
// 		console.log('users.createParticipant end');
// 		return API.v1.success({ user: Users.findOneById(newUserId, { fields }) });
// 	},
// });
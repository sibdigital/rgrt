import { Base } from './_Base';

class Persons extends Base {
	constructor() {
		super('persons');
	}

	create(person) {
		person.createdAt = new Date();
		return this.insert(person);
	}

	removeById(_id) {
		return this.remove({ _id });
	}

	updatePerson(_id, person) {
		const data = this.findOne({ _id });
		data._updatedAt = new Date();

		return this.update({ _id }, { $set: { ...data, ...person } });
	}

	addToCouncil(council, personId) {
		const data = this.findOne({ _id: personId });
		data._updatedAt = new Date();
		data.councils = data.councils ? [...data.councils, council] : [council];

		return this.update({ _id: personId }, { $set: { ...data } });
	}

	removeFromCouncil(councilId, personId) {
		const data = this.findOne({ _id: personId });
		if (data.councils) {
			return this.update({ _id: personId }, { $pull: { councils: { _id: councilId } } });
		}
	}

	findByIdSorted(_idArray) {
		const aggregate = [
			{ $match: { _id: { $in: _idArray } } },
			{
				$project: {
					_id: 1,
					surname: 1,
					lowerSurname: { $toLower: '$surname' },
					name: 1,
					lowerName: { $toLower: '$name' },
					patronymic: 1,
					lowerPatronymic: { $toLower: '$patronymic' },
					phone: 1,
					email: 1,
					weight: 1,
				},
			},
			{ $sort: { weight: -1, lowerSurname: 1, lowerName: 1, lowerPatronymic: 1 } },
		];
		const persons = Promise.await(this.model.rawCollection().aggregate(aggregate).toArray());

		return persons;
	}
}

export default new Persons();

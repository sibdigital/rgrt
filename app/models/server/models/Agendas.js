import { ObjectID } from 'bson';

import { Base } from './_Base';

class Agendas extends Base {
	constructor() {
		super('agendas');
	}

	create(agenda) {
		agenda.createdAt = new Date();
		return this.insert(agenda);
	}

	addSection(_id, sectionData) {
		const sectionId = new ObjectID().toHexString();
		sectionData._id = sectionId;

		const data = this.findOne({ _id });
		data._updatedAt = new Date();

		data.sections = data.sections ? data.sections.concat(sectionData) : [sectionData];
		this.update({ _id }, { $set: { ...data } });
		return sectionId;
	}

	updateSection(agendaId, sectionId, sectionData) {
		const data = this.findOne({ _id: agendaId });

		if (data.sections) {
			data.sections = data.sections.map((section) => {
				if (section._id === sectionId) {
					return sectionData;
				}
				return section;
			});
		} else {
			data.sections = [sectionData];
		}
		data._updatedAt = new Date();
		return this.update({ _id: agendaId }, { $set: { ...data } });
	}

	updateAgenda(_id, data) {
		data._updatedAt = new Date();
		return this.update({ _id }, { $set: { ...data } });
	}
}

export default new Agendas();

/* eslint-disable no-else-return */
import { Base } from './_Base';

class ProtocolItemsPersonsResponsible extends Base {
	constructor() {
		super('ProtocolItemsPersonsResponsible');
	}

	create(protocolItemsPersonsResponsible) {
		protocolItemsPersonsResponsible.createdAt = new Date();
		return this.insert(protocolItemsPersonsResponsible);
	}

	updateProtocolItemsPersonsResponsible(protocolItemsPersonsResponsible) {
		const data = this.findOne({
			protocolId: protocolItemsPersonsResponsible.protocolId,
			sectionId: protocolItemsPersonsResponsible.sectionId,
			itemId: protocolItemsPersonsResponsible.itemId,
		});
		if (!data) {
			return this.create(protocolItemsPersonsResponsible);
		}
		data._updatedAt = new Date();
		data.persons = protocolItemsPersonsResponsible.persons;
		return this.update({ _id: data._id }, { $set: { ...data } });
	}

	removeByItemId(itemId) {
		return this.remove({ itemId });
	}
}

export default new ProtocolItemsPersonsResponsible();

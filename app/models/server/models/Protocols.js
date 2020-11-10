import { Base } from './_Base';
import { ObjectID } from 'bson';

class Protocols extends Base {
	constructor() {
		super('protocols');
	}

	// INSERT
	create(data) {
		return this.insert(data);
	}

	// REMOVE
	removeById(_id) {
		return this.remove({ _id });
	}

	// UPDATE
	updateProtocol(_id, data) {
		data._updatedAt = new Date();
		return this.update({ _id }, { $set: { ...data } });
	}

	createSection(protocolId, sectionData) {
		const _id = new ObjectID().toHexString();
		sectionData._id = _id;

		const data = this.findOne({ _id: protocolId });

		if (data.sections) {
			let internalNum = 0;
			data.sections.forEach((section) => {
				if (section.inum > internalNum) {
					internalNum = section.inum;
				}
			})
			internalNum++;
			sectionData.inum = internalNum;
			data.sections = [...data.sections, sectionData];
		} else {
			sectionData.inum = 1;
			data.sections = [sectionData];
		}

		data._updatedAt = new Date();
		this.update({ _id: protocolId }, { $set: { ...data } });

		return _id;
	}

	removeSectionById(protocolId, _id) {
		const data = this.findOne({ _id: protocolId });

		if (data.sections) {
			data.sections = data.sections.filter(section => section._id !== _id);
			data._updatedAt = new Date();
			this.update({ _id: protocolId }, { $set: { ...data }});
		}
	}

	updateSection(protocolId, sectionData) {
		const data = this.findOne({ _id: protocolId });

		if (data.sections) {
			data.sections = data.sections.map((section) => {
				if (section._id === sectionData._id) {
					return { ...sectionData, inum: section.inum, items: section.items };
				}
				return section;
			});

			data._updatedAt = new Date();
			this.update({ _id: protocolId }, { $set: { ...data }});
		}

		return sectionData._id;
	}

	createItem(protocolId, sectionId, item) {
		const _id = new ObjectID().toHexString();
		item._id = _id;

		const data = this.findOne({ _id: protocolId });

		if (data.sections) {
			data._updatedAt = new Date();

			data.sections.forEach((section) => {
				if (section._id === sectionId) {

					if (section.items) {
						let internalNum = 0;
						section.items.forEach((item) => {
							if (item.inum > internalNum) {
								internalNum = item.inum;
							}
						})
						internalNum++;
						item.inum = internalNum;
						section.items = [...section.items, item];
					} else {
						item.inum = 1;
						section.items = [item];
					}

				}
			});

			this.update({ _id: protocolId }, { $set: { ...data } })
		}

		return _id;
	}

	removeItemById(protocolId, sectionId, _id) {
		const data = this.findOne({ _id: protocolId });

		if (data.sections) {
			data.sections = data.sections.map((section) => {
				if (section._id === sectionId) {
					section.items = section.items.filter(item => item._id !== _id);
				}
				return section;
			});

			data._updatedAt = new Date();
			this.update({ _id: protocolId }, { $set: { ...data }});
		}
	}

	updateItem(protocolId, sectionId, itemData) {
		const data = this.findOne({ _id: protocolId });

		if (data.sections) {
			data.sections = data.sections.map((section) => {
				if (section._id === sectionId) {
					section.items = section.items.map((item) => {
						if (item._id === itemData._id) {
							return { ...itemData, inum: item.inum };
						}
						return item;
					})
				}
				return section;
			});

			data._updatedAt = new Date();
			this.update({ _id: protocolId }, { $set: { ...data }});
		}

		return itemData._id;
	}

	addParticipant(protocolId, userId) {
		return this.update({
			_id: protocolId,
			participants: { $ne: userId },
		}, {
			$addToSet: { participants: userId },
		});
	}

	removeParticipantById(protocolId, userId) {
		const data = this.findOne({ _id: protocolId });

		if (data.participants) {
			this.update({ _id: protocolId }, { $pull: { participants: userId }});
		}
	}
}

export default new Protocols();

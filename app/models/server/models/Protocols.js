import { Base } from './_Base';

class Protocols extends Base {
	constructor() {
		super('protocols');
	}

	// INSERT
	create(data) {
		data.num = Number(data.num);
		data.createdAt = new Date();
		return this.insert(data);
	}

	// REMOVE
	removeById(_id) {
		return this.remove({ _id });
	}

	// UPDATE
	updateProtocol(_id, data) {
		data._updatedAt = new Date();
		data.num = Number(data.num);
		return this.update({ _id }, { $set: { ...data } });
	}

	createSection(protocolId, sectionData) {
		const _id = Random.id();
		sectionData._id = _id;

		sectionData.num = Number(sectionData.num);

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
					sectionData.num = Number(sectionData.num);
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
		const _id = Random.id();
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
						});
						internalNum++;
						item.inum = internalNum;
						section.items = [...section.items, item];
					} else {
						item.inum = 1;
						section.items = [item];
					}
				}
			});

			this.update({ _id: protocolId }, { $set: { ...data } });
			return _id;
		}
		return null;
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

	getMaxProtocolNum() {
		const data = this.findOne({}, { sort: { num: -1 }, limit: 1 });
		if (data) {
			return data.num;
		}
		return 0;
	}

	getMaxProtocolSectionNum(protocolId) {
		const data = this.findOne({ _id: protocolId });
		if (data && data.sections && data.sections.length > 0) {
			return Math.max.apply(Math, data.sections.map(function(section) { return section.num; }));
		}
		return 0;
	}

	getMaxProtocolSectionItemNum(protocolId, sectionId) {
		const data = this.findOne({ _id: protocolId });
		if (data.sections) {
			data.sections.map((section) => {
				if (section._id === sectionId) {
					if (section.items && section.items.length > 0) {
						return Math.max.apply(Math, section.items.map(function (item) {
							return item.num;
						}));
					}
				}
			});
		}
		return 0;
	}

	updateItemStatus(itemId, status) {
		const data = this.findOne({ 'sections.items._id': itemId });
		// console.dir({ dataTestUpdate: data });
		let isUpdated = false;
		if (data.sections) {
			data.sections = data.sections.map((section) => {
				if (section.items) {
					section.items = section.items.map((item) => {
						if (item._id === itemId) {
							isUpdated = true;
							return { ...item, status };
						}
						return item;
					});
				}
				return section;
			});
		}
		return isUpdated ? this.update({ _id: data._id }, { $set: { ...data } }) : 0;
	}
}

export default new Protocols();

import { Base } from './_Base';
import { ObjectID } from 'bson';

class Persons extends Base {
	constructor() {
		super('persons');
	}

	addToCouncil(councilId, personId) {
        const data = this.findOne({ _id: personId });
        data._updatedAt = new Date();
        data.councils = data.councils ? [...data.councils, councilId] : [councilId];

        return this.update({ _id: personId }, { $set: { ...data } });
    }
}

export default new Persons();

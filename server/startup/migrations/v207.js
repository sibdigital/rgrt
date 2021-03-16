import { Migrations } from '../../../app/migrations';
import { Protocols, Councils } from '../../../app/models/server';

Migrations.add({
	version: 207,
	up() {
		Protocols.find({ councilId: { $exists: true } }).forEach(async function (protocol) {
			const council = await Councils.findOne({ _id: protocol.councilId });

			Protocols.update(protocol._id, {
				$set: {
					council: {
						_id: protocol.councilId,
						typename: council.type.title
					}
				},
				$unset: {
					councilId: "",
				},
			});
		});
	},
});

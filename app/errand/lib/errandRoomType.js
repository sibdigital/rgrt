import { Meteor } from 'meteor/meteor';

import { RoomTypeConfig, roomTypes, getUserPreference } from '../../utils';

export class ErrandRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 't',
			order: 25,
			label: 'Errand',
		});

		// we need a custom template in order to have a custom query showing the subscriptions to discussions
		this.customTemplate = 'ErrandList';
	}

	condition() {
		return getUserPreference(Meteor.userId(), 'sidebarShowDiscussion');
	}
}

roomTypes.add(new ErrandRoomType());

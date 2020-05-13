import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { CachedCollectionManager } from '../../../ui-cached-collection';

class TagsClass {
	constructor() {
		this.list = new ReactiveVar({});
	}

	add(tag) {
		const list = this.list.get();
		list[tag._id] = tag;
		this.list.set(list);
	}

	remove(tag) {
		const list = this.list.get();
		delete list[tag._id];
		this.list.set(list);
		$(`#${ tag._id }`).remove();
	}

	update(tag) {
		const elem = $(`#${ tag._id }`);
		if (elem && elem[0]) {
			const list = this.list.get();
			list[tag._id] = tag;
			this.list.set(list);
		} else {
			this.add(tag);
		}
	}

	get(_id) {
		const list = this.list.get();
		return list[_id];
	}
}

export const Tags = new TagsClass();

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() => {
		Meteor.call('listTags', (error, result) => {
			for (const tag of result) {
				Tags.add(tag);
			}
		});
	}),
);

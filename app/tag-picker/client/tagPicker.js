import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import {APIClient, handleError, t} from '../../utils/client';
import { TagPicker } from './lib/TagPicker';
import { Tags } from '../../tags/client';

import './tagPicker.html';
import '../../theme/client/imports/components/tagPicker.css';
import s from 'underscore.string';

const ESCAPE = 27;
const LIST_SIZE = 50;
const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 500;

Template.tagPicker.helpers({
	tags() {
		return Template.instance().tags.get();
	},
	filter() {
		return Template.instance().filter.get();
	}
});

Template.tagPicker.events({
	'click .tag-picker'(event) {
		event.stopPropagation();
		event.preventDefault();
	},
	'click .tag-list .tag-picker-item'(event, instance) {
		event.stopPropagation();

		const _tag = event.currentTarget.dataset.tag;

		const input = $('.tag-picker .js-tagpicker-search');

		if (_tag === 'new') {
			const tagData = {};
			tagData.name = s.trim(input.val());
			Meteor.call('insertOrUpdateTag', tagData, (error, result) => {
				if (result) {
					tagData._id = result;
					Tags.add(tagData);
					TagPicker.pickTag(result);
				}
				if (error) {
					handleError(error);
				}
			});
		} else {
			TagPicker.pickTag(_tag);
		}

		if (input) {
			input.val('');
		}
		instance.filter.set('');
	},
	'keyup .js-tagpicker-search, change .js-tagpicker-search'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		if (event.keyCode === ESCAPE) {
			return TagPicker.close();
		}

		const value = event.target.value.trim();
		const cst = instance.filter;
		if (value === cst.get()) {
			return;
		}
		cst.set(value);
	},
});

Template.tagPicker.onCreated(function() {
	this.filter = new ReactiveVar('');
	this.total = new ReactiveVar(0);
	this.tags = new ReactiveVar([]);
	this.isLoading = new ReactiveVar(false);
	this.offset = new ReactiveVar(0);

	this.loadTags = _.debounce(async (query, offset) => {
		this.isLoading.set(true);
		const { tags, total } = await APIClient.v1.get('tags.list', {
			count: LIST_SIZE,
			offset,
			query:  JSON.stringify(query),
		});
		this.total.set(total);
		if (offset === 0) {
			this.tags.set(tags);
		} else {
			this.tags.set(this.tags.get().concat(tags));
		}
		this.isLoading.set(false);
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS);

	this.autorun(() => {
		const filter = this.filter.get() && this.filter.get().trim();
		const offset = this.offset.get();
		if (filter) {
			const regex = { $regex: filter, $options: 'i' };
			return this.loadTags({ name: regex }, offset);
		}
		return this.loadTags({}, offset);
	});
});

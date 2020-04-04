import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import _ from 'underscore';

import { RocketChatTabBar, SideNav, TabBar } from '../../../ui-utils';
import { APIClient } from '../../../utils/client';

const LIST_SIZE = 50;
const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 500;

Template.adminTags.helpers({
	searchText() {
		const instance = Template.instance();
		return instance.filter && instance.filter.get();
	},
	tags() {
		return Template.instance().tags.get();
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	flexData() {
		return {
			tabBar: Template.instance().tabBar,
			data: Template.instance().tabBarData.get(),
		};
	},
	onTableScroll() {
		const instance = Template.instance();
		return function(currentTarget) {
			if ((currentTarget.offsetHeight + currentTarget.scrollTop) < (currentTarget.scrollHeight - 100)) {
				return;
			}
			const tags = instance.tags.get();
			if (instance.total.get() > tags.length) {
				instance.offset.set(instance.offset.get() + LIST_SIZE);
			}
		};
	},
	onTableItemClick() {
		const instance = Template.instance();
		return function(item) {
			instance.tabBarData.set({
				tag_: instance.tags.get().find((tag) => tag._id === item._id),
				onSuccess: instance.onSuccessCallback,
			});
			instance.tabBar.showGroup('tags-selected');
			instance.tabBar.open('admin-tag-info');
		};
	},
});

Template.adminTags.onCreated(async function() {
	const instance = this;
	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.ready = new ReactiveVar(false);
	this.total = new ReactiveVar(0);
	this.query = new ReactiveVar({});
	this.tags = new ReactiveVar([]);
	this.isLoading = new ReactiveVar(false);
	this.offset = new ReactiveVar(0);

	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	this.tabBarData = new ReactiveVar();

	TabBar.addButton({
		groups: ['tags', 'tags-selected'],
		id: 'add-tag',
		i18nTitle: 'Tag_Add',
		icon: 'plus',
		template: 'adminTagEdit',
		order: 1,
	});

	TabBar.addButton({
		groups: ['tags-selected'],
		id: 'admin-tag-info',
		i18nTitle: 'Tag_Info',
		icon: 'customize',
		template: 'adminTagInfo',
		order: 2,
	});
	this.onSuccessCallback = () => {
		this.offset.set(0);
		return this.loadTags(this.query.get(), this.offset.get());
	};
	this.tabBarData.set({
		onSuccess: instance.onSuccessCallback,
	});

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

Template.adminTags.onRendered(() =>
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	}),
);

Template.adminTags.events({
	'keydown #tag-filter'(e) {
		// stop enter key
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},

	'keyup #tag-filter'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	},
});

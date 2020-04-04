import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { modal } from '../../../ui-utils';
import { t, handleError } from '../../../utils';

Template.tagInfo.helpers({
	name() {
		const tag = Template.instance().tag.get();
		return tag.name;
	},

	tag() {
		return Template.instance().tag.get();
	},

	editingTag() {
		return Template.instance().editingTag.get();
	},

	tagToEdit() {
		const instance = Template.instance();
		return {
			tabBar: this.tabBar,
			tag: instance.tag.get(),
			onSuccess: instance.onSuccess,
			back(name) {
				instance.editingTag.set();

				if (name != null) {
					const tag = instance.tag.get();
					if (tag != null && tag.name != null && tag.name !== name) {
						return instance.loadedName.set(name);
					}
				}
			},
		};
	},
});

Template.tagInfo.events({
	'click .thumb'(e) {
		$(e.currentTarget).toggleClass('bigger');
	},

	'click .delete'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		const tag = instance.tag.get();
		if (tag != null) {
			const { _id } = tag;
			modal.open({
				title: t('Are_you_sure'),
				text: t('Tag_Delete_Warning'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes_delete_it'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: false,
				html: false,
			}, function() {
				Meteor.call('deleteTag', _id, (error/* , result*/) => {
					if (error) {
						handleError(error);
					} else {
						modal.open({
							title: t('Deleted'),
							text: t('Tag_Has_Been_Deleted'),
							type: 'success',
							timer: 2000,
							showConfirmButton: false,
						});
						instance.onSuccess();
						instance.tabBar.close();
					}
				});
			});
		}
	},

	'click .edit-tag'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		instance.editingTag.set(instance.tag.get()._id);
	},
});

Template.tagInfo.onCreated(function() {
	this.tag = new ReactiveVar();
	this.editingTag = new ReactiveVar();
	this.loadedName = new ReactiveVar();
	this.tabBar = Template.currentData().tabBar;
	this.onSuccess = Template.currentData().onSuccess;

	this.autorun(() => {
		const data = Template.currentData();
		if (data != null && data.clear != null) {
			this.clear = data.clear;
		}
	});

	this.autorun(() => {
		const data = Template.currentData().tag_;
		const tag = this.tag.get();
		if (tag != null && tag.name != null) {
			this.loadedName.set(tag.name);
		} else if (data != null && data.name != null) {
			this.loadedName.set(data.name);
		}
	});

	this.autorun(() => {
		const data = Template.currentData().tag_;
		this.tag.set(data);
	});
});

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import toastr from 'toastr';
import s from 'underscore.string';

import { t, handleError } from '../../../utils';

Template.tagEdit.helpers({
	tag() {
		return Template.instance().tag;
	},
});

Template.tagEdit.events({
	'click .cancel'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.cancel(t.find('form'));
	},

	'submit form'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.save(e.currentTarget);
	},
});

Template.tagEdit.onCreated(function() {
	if (this.data != null) {
		this.tag = this.data.tag;
	} else {
		this.tag = undefined;
	}

	this.tabBar = Template.currentData().tabBar;
	this.onSuccess = Template.currentData().onSuccess;

	this.cancel = (form, name) => {
		form.reset();
		this.tabBar.close();
		if (this.tag) {
			this.data.back(name);
		}
	};

	this.getTagData = () => {
		const tagData = {};
		if (this.tag != null) {
			tagData._id = this.tag._id;
			tagData.previousName = this.tag.name;
		}
		tagData.name = s.trim(this.$('#name').val());
		return tagData;
	};

	this.validate = () => {
		const tagData = this.getTagData();

		const errors = [];
		if (!tagData.name) {
			errors.push('Name');
		}

		return errors.length === 0;
	};

	this.save = (form) => {
		if (this.validate()) {
			const tagData = this.getTagData();

			Meteor.call('insertOrUpdateTag', tagData, (error, result) => {
				if (result) {
					if (tagData._id) {
						toastr.success(t('Tag_Updated_Successfully'));
					} else {
						toastr.success(t('Tag_Added_Successfully'));
					}
					this.onSuccess();
					this.cancel(form, tagData.name);
				}

				if (error) {
					handleError(error);
				}
			});
		}
	};
});

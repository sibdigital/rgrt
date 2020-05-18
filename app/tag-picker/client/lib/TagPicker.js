import _ from 'underscore';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

export const TagPicker = {
	width: 365,
	height: 300,
	initiated: false,
	input: null,
	source: null,
	opened: false,
	pickCallback: null,
	scrolling: false,
	async init() {
		if (this.initiated) {
			return;
		}

		this.initiated = true;

		Blaze.render(Template.tagPicker, document.body);

		$(document).click((event) => {
			if (!this.opened) {
				return;
			}
			if (!$(event.target).closest('.tag-picker').length && !$(event.target).is('.tag-picker')) {
				if (this.opened) {
					this.close();
				}
			}
		});

		$(window).resize(_.debounce(() => {
			if (!this.opened) {
				return;
			}
			this.setPosition();
		}, 300));
	},
	isOpened() {
		return this.opened;
	},
	setPosition() {
		const windowHeight = window.innerHeight;
		const windowWidth = window.innerWidth;
		const windowBorder = 10;
		const sourcePos = $(this.source).offset();
		const {left, top} = sourcePos;
		const cssProperties = {top, left};
		const isLargerThanWindow = this.width + windowBorder > windowWidth;

		if (top + this.height >= windowHeight) {
			cssProperties.top = windowHeight - this.height - windowBorder - 75;
		}

		if (left < windowBorder) {
			cssProperties.left = isLargerThanWindow ? 0 : windowBorder;
		}

		if (left + this.width >= windowWidth) {
			cssProperties.left = isLargerThanWindow ? 0 : windowWidth - this.width - windowBorder;
		}

		return $('.tag-picker').css(cssProperties);
	},
	async open(source, callback) {
		if (!this.initiated) {
			await this.init();
		}
		this.pickCallback = callback;
		this.source = source;

		const containerEl = this.setPosition();
		containerEl.addClass('show');

		const tagInput = containerEl.find('.js-tagpicker-search');
		if (tagInput) {
			tagInput.focus();
		}

		this.opened = true;
	},
	close() {
		$('.tag-picker').removeClass('show');
		this.opened = false;
		this.source.focus();
	},
	pickTag(tag) {
		this.pickCallback(tag);

		this.close();
	},
};

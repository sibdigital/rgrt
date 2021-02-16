import { t } from '../index';
import { modal } from '../../../ui-utils';

export const createInteractionActions = (title, content) => (e) => {
	modal.open({
		title: t(title),
		content,
		data: {
			onCreate() {
				modal.close();
			},
		},
		modifier: 'modal',
		showConfirmButton: false,
		showCancelButton: false,
		confirmOnEnter: false,
	});
};
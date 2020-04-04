import { AdminBox } from '../../../ui-utils';
import { hasAtLeastOnePermission } from '../../../authorization';

AdminBox.addOption({
	href: 'tags',
	i18nLabel: 'Tags',
	icon: 'hashtag',
	permissionGranted() {
		return hasAtLeastOnePermission('manage-tags');
	},
});

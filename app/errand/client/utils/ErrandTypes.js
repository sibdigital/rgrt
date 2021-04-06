import { t } from '../../../utils';

export const ErrandTypes = Object.freeze({
	default: { state: 0, key: 'default', title: 'Errand', i18nLabel: t('Errand') },
	byRequestAnswer: { state: 1, key: 'byRequestAnswer', title: 'Errand_by_request', i18nLabel: t('Errand_by_request') },
	byProtocolItem: { state: 2, key: 'byProtocolItem', title: 'Errand_by_protocol_item', i18nLabel: t('Errand_by_protocol_item') },

	getErrandTypeByState: ({ state }) => {
		for (const [key, value] of Object.entries(ErrandTypes)) {
			if (typeof value === 'object' && value.state === state) {
				return value;
			}
		}
	},
});

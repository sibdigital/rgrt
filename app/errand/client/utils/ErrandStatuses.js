import { t } from '../../../utils';

export const ErrandStatuses = Object.freeze({
	OPENED: { state: 1, key: 'OPENED', title: 'opened', i18nLabel: t('opened') },
	IN_PROGRESS: { state: 2, key: 'IN_PROGRESS', title: 'inProgress', i18nLabel: t('inProgress') },
	CANCELED: { state: 3, key: 'CANCELED', title: 'canceled', i18nLabel: t('canceled') },
	SOLVED: { state: 4, key: 'SOLVED', title: 'solved', i18nLabel: t('solved') },
	CLOSED: { state: 5, key: 'CLOSED', title: 'closed', i18nLabel: t('closed') },

	getErrandStatusesByState: ({ state }) => {
		for (const [key, value] of Object.entries(ErrandStatuses)) {
			if (typeof value === 'object' && value.state === state) {
				return { ...value, i18nLabel: t(value.i18nLabel) };
			}
		}
	},

	getOptionsForSelect: () => {
		const options = [];
		for (const [key, value] of Object.entries(ErrandStatuses)) {
			if (typeof value === 'object') {
				options.push([key, t(value.i18nLabel)]);
			}
		}
		return options;
	},
});

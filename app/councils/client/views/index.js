import React, { useEffect, useCallback } from 'react';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { Councils } from './Councils';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';

export function CouncilsPage() {
	const t = useTranslation();

	return <Page>
		<Page.Header title={t('Councils')} />
		<Page.Content>

		</Page.Content>
	</Page>;
}

CouncilsPage.displayName = 'CouncilsPage';

export default CouncilsPage;

import React, { useCallback, useMemo, useState } from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import '../../public/stylesheets/mail-sender.css';
import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import MailForm from './MailForm';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

export const useQuery = (params, sort, cache) => useMemo(() => ({
	query: JSON.stringify({ desc: { $regex: params.text || '', $options: 'i' } }),
	sort: JSON.stringify({ [sort[0]]: sortDir(sort[1]) }),
	...params.itemsPerPage && { count: params.itemsPerPage },
	...params.current && { offset: params.current },
}), [JSON.stringify(params), JSON.stringify(sort), cache]);

export function MailSenderPage() {
	const t = useTranslation();

	const routeName = 'councils';

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['d', 'desc']);
	const [cache, setCache] = useState();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('councils.list', query) || { result: [] };

	const router = useRoute(routeName);

	const mobile = useMediaQuery('(max-width: 420px)');
	const small = useMediaQuery('(max-width: 780px)');

	const onEditClick = (_id) => () => {
		router.push({
			context: 'edit',
			id: _id,
		});
	};

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	};

	const handleHeaderButtonClick = useCallback((context) => () => {
		router.push({ context });
	}, [router]);

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Send_email')}>
			</Page.Header>
			<Page.Content>
				<MailForm/>
			</Page.Content>
		</Page>
	</Page>;
}

MailSenderPage.displayName = 'MailSenderPage';

export default MailSenderPage;

import React, { useCallback, useMemo, useState } from 'react';
import { Button, Field, Box, Label, Tabs, Select } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { Councils } from './Councils';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { hasPermission } from '../../../authorization';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { useUserId } from '../../../../client/contexts/UserContext';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

export const useQuery = ({ text, itemsPerPage, current }, [column, direction], cache) => useMemo(() => ({
	query: JSON.stringify({ desc: { $regex: text || '', $options: 'i' } }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	fields: JSON.stringify({ d: 1, desc: 1, type: 1 }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
	// TODO: remove cache. Is necessary for data invalidation
}), [text, itemsPerPage, current, column, direction, cache]);

export function CouncilsPage() {
	const t = useTranslation();

	const routeName = 'councils';

	const isAllow = hasPermission('edit-councils', useUserId());

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['d', 'desc']);
	const [cache, setCache] = useState();
	const [displayMode, setDisplayMode] = useState('table');

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('councils.list', query) || { result: [] };

	const router = useRoute(routeName);

	const onClick = (_id) => () => {
		FlowRouter.go(`/council/${ _id }`);
	};

	const onEditClick = (_id) => () => {
		FlowRouter.go(`/council/edit/${ _id }`);
	};

	const onAddClick = () => {
		FlowRouter.go('/council/add/new');
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

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const displayOptions = useMemo(() => [['table', t('Table')], ['calendar', t('Calendar')]], [t]);

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Councils')}</Label>
				</Field>
				{ isAllow && <Button width='200px' primary small onClick={onAddClick} aria-label={t('Add')}>
					{ t('Add') }
				</Button>}
			</Page.Header>
			<Page.Content>
				<Box display='flex' flexDirection='row' maxWidth='x250' alignItems='center' mbe='x16' flexShrink={0} alignSelf='end'>
					<Label mi='x8'>{t('Display_format')}:</Label>
					<Select value={displayMode} options={displayOptions} onChange={(val) => setDisplayMode(val)}/>
				</Box>
				{/*<Tabs flexShrink={0} mbe='x8'>*/}
				{/*	<Tabs.Item selected={displayMode === 'table'} onClick={() => setDisplayMode('table')}>{t('Table')}</Tabs.Item>*/}
				{/*	<Tabs.Item selected={displayMode === 'calendar'} onClick={() => setDisplayMode('calendar')}>{t('Calendar')}</Tabs.Item>*/}
				{/*</Tabs>*/}
				<Councils displayMode={displayMode} setParam={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onEditClick={onEditClick} onClick={onClick} onChange={onChange} sort={sort}/>
			</Page.Content>
		</Page>
	</Page>;
}

CouncilsPage.displayName = 'CouncilsPage';

export default CouncilsPage;

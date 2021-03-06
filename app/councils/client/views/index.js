import React, { useCallback, useMemo, useState } from 'react';
import { Button, Field, Box, Label, FieldGroup, Select, Tabs, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tooltip } from '@material-ui/core';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { Councils } from './Councils';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
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
	const [cache, setCache] = useState(new Date());
	const [displayMode, setDisplayMode] = useState('table');

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const mediaQuery = useMediaQuery('(min-width: 520px)');

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('councils.list', query) || { result: [] };

	const router = useRoute(routeName);

	const context = useRouteParameter('context');

	useMemo(() => {
		if (context && context !== displayMode) {
			setDisplayMode(context);
		}
	}, [context, displayMode]);

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

	const handleTabClick = useCallback((context) => {
		console.log({ context });
		setDisplayMode(context);
		router.push({ context });
	}, [router]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	return <Page flexDirection='row'>
		<Page>
			<Page.Header display={mediaQuery ? 'flex' : 'block'} title=''>
				<Field display='block' flexDirection='row' width='auto' alignItems='center' marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Councils')}</Label>
				</Field>
				<FieldGroup flexDirection='row' alignItems='center' justifyContent={mediaQuery ? 'center' : 'left'} mis='auto'>
					<Tabs mbe='x8' flexShrink={0} width='auto'>
						<Tooltip title={t('List')} arrow>
							<Tabs.Item selected={displayMode === 'table'} onClick={() => handleTabClick('table')}>
								<Icon name='list'/>
							</Tabs.Item>
						</Tooltip>
						<Tooltip title={t('Calendar')} arrow>
							<Tabs.Item selected={displayMode === 'calendar'} onClick={() => handleTabClick('calendar')}>
								<Icon name='calendar'/>
							</Tabs.Item>
						</Tooltip>
					</Tabs>
					{ isAllow && <Button mbs='0' width='auto' pi='x16' primary small onClick={onAddClick} aria-label={t('Add')}>
						<Icon name='plus' size={16} mie='x4'/>{ t('Add') }
					</Button>}
				</FieldGroup>
			</Page.Header>
			<Page.Content>
				<Councils displayMode={displayMode} setParams={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onEditClick={onEditClick} onClick={onClick} onChange={onChange} sort={sort}/>
			</Page.Content>
		</Page>
	</Page>;
}

CouncilsPage.displayName = 'CouncilsPage';

export default CouncilsPage;

// eslint-disable

import React, { useMemo, useState, useCallback } from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import { usePermission } from '../../contexts/AuthorizationContext';
import { useTranslation } from '../../contexts/TranslationContext';
import Page from '../../components/basic/Page';
import { AdminTags } from './AdminTags';
import { AddTag } from './AddTag';
import { EditTagWithData } from './EditTag';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import VerticalBar from '../../components/basic/VerticalBar';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

export const useQuery = ({ text, itemsPerPage, current }, [column, direction], cache) => useMemo(() => ({
	query: JSON.stringify({ name: { $regex: text || '', $options: 'i' } }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
	// TODO: remove cache. Is necessary for data invalidation
}), [text, itemsPerPage, current, column, direction, cache]);

export default function AdminTagsRoute({ props }) {
	const t = useTranslation();
	const canManageTags = usePermission('manage-tags');

	const routeName = 'tags';

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);
	const [cache, setCache] = useState();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('tags.list', query) || {};

	const router = useRoute(routeName);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const onClick = useCallback((_id) => () => {
		router.push({
			context: 'edit',
			id: _id,
		});
	}, [router]);

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

	const close = useCallback(() => {
		router.push({});
	}, [router]);

	if (!canManageTags) {
		return <NotAuthorizedPage />;
	}

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);


	return <Page {...props} flexDirection='row'>
		<Page name='admin-tags'>
			<Page.Header title={t('Tags')}>
				<Button small onClick={handleHeaderButtonClick('new')} aria-label={t('New')}>
					<Icon name='plus'/>
				</Button>
			</Page.Header>
			<Page.Content>
				<AdminTags setParams={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onClick={onClick} sort={sort}/>
			</Page.Content>
		</Page>
		{ context
			&& <VerticalBar className='contextual-bar' width='380px' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
				<VerticalBar.Header>
					{ context === 'edit' && t('Tag_Info') }
					{ context === 'new' && t('Tag_Add') }
					<VerticalBar.Close onClick={close}/>
				</VerticalBar.Header>
				{context === 'edit' && <EditTagWithData _id={id} close={close} onChange={onChange} cache={cache}/>}
				{context === 'new' && <AddTag goToNew={onClick} close={close} onChange={onChange}/>}
			</VerticalBar>}
	</Page>;
}

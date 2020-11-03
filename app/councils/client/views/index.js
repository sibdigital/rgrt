import React, { useCallback, useMemo, useState } from 'react';
import { Button, Field, Icon, Label } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { Councils } from './Councils';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { EditCouncil } from './EditCouncil';
import { AddCouncil } from './AddCouncil';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

export const useQuery = ({ text, itemsPerPage, current }, [ column, direction ], cache) => useMemo(() => ({
	query: JSON.stringify({ desc: { $regex: text || '', $options: 'i' } }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
	// TODO: remove cache. Is necessary for data invalidation
}), [text, itemsPerPage, current, column, direction, cache]);

export function CouncilsPage() {
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

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const onClick = (_id) => () => {
		FlowRouter.go(`/council/${ _id }`);
	};

	const onEditClick = (_id) => () => {
		FlowRouter.go(`/council/edit/${ _id }`);
	};

	const onAddClick = () => {
		FlowRouter.go('/council/edit/new');
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

	const close = useCallback(() => {
		router.push({});
	}, [router]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const goBack = () => {
		window.history.back();
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<Button className='go-back-button' onClick={goBack}>
						<Icon name='back'/>
					</Button>
					<Label fontScale='h1'>{t('Councils')}</Label>
				</Field>
				<Button width='200px' primary small onClick={onAddClick} aria-label={t('Council_Add')}>
					{ t('Council_Add') }
				</Button>
			</Page.Header>
			<Page.Content>
				<Councils setParam={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onEditClick={onEditClick} onClick={onClick} onChange={onChange} sort={sort}/>
			</Page.Content>
		</Page>
		{ context
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{/*{ context === 'edit' && t('Council_Info') }*/}
				{ context === 'new' && t('Council_Add') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			{/*{context === 'edit' && <EditCouncil _id={id} close={close} onChange={onChange} cache={cache}/>}*/}
			{context === 'new' && <AddCouncil goToNew={onEditClick} close={close} onChange={onChange}/>}
		</VerticalBar>}
	</Page>;
}

CouncilsPage.displayName = 'CouncilsPage';

export default CouncilsPage;

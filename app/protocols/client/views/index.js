import React, { useCallback, useMemo, useState } from 'react';
import { Button, Field, Icon, Label } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { Protocols } from './Protocols';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { EditProtocol } from './EditProtocol';
import { AddProtocol } from './AddProtocol';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ itemsPerPage, current }, [ column, direction ]) => useMemo(() => ({
	// query: JSON.stringify({ desc: { $regex: text || '', $options: 'i' } }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	fields: JSON.stringify({ d: 1, num: 1, name: 1, place: 1, council: 1 }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
	// TODO: remove cache. Is necessary for data invalidation
}), [itemsPerPage, current, column, direction]);

export function ProtocolsPage() {
	const t = useTranslation();

	const routeName = 'protocols';

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['d', 'desc']);
	const [cache, setCache] = useState();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort);

	const data = useEndpointData('protocols.list', query) || { result: [] };

	const router = useRoute(routeName);

	const mediaQuery = useMediaQuery('(min-width: 520px)');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const onClick = (_id) => () => {
		FlowRouter.go(`/protocol/${ _id }`);
	};

	const onEditClick = (_id) => () => {
		FlowRouter.go(`/protocol/${ _id }/edit`);
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
		FlowRouter.go('home');
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton onClick={goBack}/>
					<Label fontScale={mediaQuery ? 'h1' : 'h2'}>{t('Protocols')}</Label>
				</Field>
				{ !context && <Button mbs='0' pi='x16' width='150px' primary small onClick={handleHeaderButtonClick('new')} aria-label={t('New')}>
					{ t('Add') }
				</Button>}
			</Page.Header>
			<Page.Content>
				<Protocols setParams={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onEditClick={onEditClick} onClick={onClick} onChange={onChange} sort={sort}/>
			</Page.Content>
		</Page>
		{ context
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'edit' && t('Protocol_Info') }
				{ context === 'new' && t('Protocol_Add') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			{context === 'edit' && <EditProtocol _id={id} close={close} onChange={onChange} cache={cache}/>}
			{ context === 'new' && <AddProtocol goToNew={onClick} close={close} onChange={onChange}/>}
		</VerticalBar>}
	</Page>;
}

ProtocolsPage.displayName = 'ProtocolsPage';

export default ProtocolsPage;

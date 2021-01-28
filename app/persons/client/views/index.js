import React, { useCallback, useMemo, useState } from 'react';
import { ButtonGroup, Button, Field, Label, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { Persons } from './Persons';
import { EditPerson } from './EditPerson';


const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

export const useQuery = ({ text, itemsPerPage, current }, [column, direction], cache) => useMemo(() => ({
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	// query: JSON.stringify({ workingGroup: { $regex: text || '', $options: 'i' } }),
	// fields: JSON.stringify({ emails: 1, surname: 1, name: 1, patronymic: 1, position: 1, organization: 1, phone: 1, workingGroup: 1 }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
	// TODO: remove cache. Is necessary for data invalidation
}), [text, itemsPerPage, current, column, direction, cache]);

export function PersonsPage() {
	const t = useTranslation();
	const routeName = 'persons';

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['_id']);
	const [cache, setCache] = useState();
	const [currentPerson, setCurrentPerson] = useState({});

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('persons.list', query) || {};

	const router = useRoute(routeName);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	useMemo(() => console.log(data), [data]);

	const onCLick = useCallback((_id, person = null) => () => {
		setCurrentPerson(person);
		router.push({
			context: 'edit',
			id: _id,
		});
	}, [router]);

	const onEditClick = useCallback((_id, person = null) => () => {
		setCurrentPerson(person);
		router.push({
			context: 'edit',
			id: _id,
		});
	}, [router]);

	const onAddClick = useCallback(() => () => {
		router.push({
			context: 'new',
		});
	}, [router]);

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;
		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'workingGroup' : 'asc']);
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

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Persons')}</Label>
				</Field>
				<ButtonGroup>
					<Button small primary onClick={onAddClick()} aria-label={t('Add')}>
						{t('Add')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<Persons setParam={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onClick={onCLick} onEditClick={onEditClick} sort={sort}/>
			</Page.Content>
		</Page>
		{ context
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'edit' && t('Person_edit') }
				{ context === 'new' && t('Person_add') }
				<VerticalBar.Close onClick={close}/></VerticalBar.Header>
			<VerticalBar.Content>
				{context === 'edit' && <EditPerson _id={id} person={currentPerson} close={close} onChange={onChange} cache={cache}/>}
				{context === 'new' && <EditPerson _id={null} persons={null} close={close} onChange={onChange} cache={cache}/>}
			</VerticalBar.Content>
		</VerticalBar>}
	</Page>;
}

PersonsPage.displayName = 'PersonsPage';

export default PersonsPage;

import React, { useCallback, useMemo, useState } from 'react';
import { ButtonGroup, Button, Field, Label } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { WarningModal } from '../../../utils/index';
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
	const [sort, setSort] = useState(['weight']);
	const [cache, setCache] = useState(new Date());
	const [currentPerson, setCurrentPerson] = useState({});

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('persons.list', query) || {};
	const { data: workingGroupData, state: workingGroupState } = useEndpointDataExperimental('working-groups.list', useMemo(() => ({
		query: JSON.stringify({ type: { $ne: 'subject' } }),
	}), []));

	const router = useRoute(routeName);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const setModal = useSetModal();

	const dispatchToastMessage = useToastMessageDispatch();

	const deletePerson = useMethod('deletePerson');

	useMemo(() => console.log(data), [data]);

	const workingGroupOptions = useMemo(() => {
		const res = [[null, t('Not_chosen')]];
		if (workingGroupData && workingGroupData.workingGroups?.length > 0) {
			return res.concat(workingGroupData.workingGroups.map((workingGroup) => [workingGroup._id, workingGroup.title]));
		}
		return res;
	}, [workingGroupData]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const onEditClick = useCallback((_id, person = null) => () => {
		const personToEdit = { ...person };
		person && !person.organization && Object.assign(personToEdit, { organization: '' });
		person && !person.position && Object.assign(personToEdit, { position: '' });
		person && !person.group && Object.assign(personToEdit, { group: { _id: '', title: '' } });
		setCurrentPerson(personToEdit);
		router.push({
			context: 'edit',
			id: _id,
		});
	}, [router]);

	const delConfirm = useCallback(async(_id) => {
		try {
			console.log(_id)
			await deletePerson(_id);
			setModal(undefined)
			onChange();
			dispatchToastMessage({ type: 'success', message: t('Person_was_deleted_successful') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [deletePerson, dispatchToastMessage, onChange])

	const onDel = (_id) => () => {
		delConfirm(_id);
	};

	const onDeleteClick = (_id) => () => setModal(
		() => <WarningModal title={t('Are_you_sure')} contentText={t('Person_delete_warning')} onDelete={onDel(_id)} onCancel={() => setModal(undefined)}/>
	);

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
				<Persons setParam={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onClick={onEditClick} onEditClick={onEditClick} onDeleteClick={onDeleteClick} sort={sort}/>
			</Page.Content>
		</Page>
		{ context
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'edit' && t('Person_edit') }
				{ context === 'new' && t('Person_add') }
				<VerticalBar.Close onClick={close}/></VerticalBar.Header>
			<VerticalBar.ScrollableContent mbe='x32'>
				{context === 'edit' && <EditPerson workingGroupOptions={workingGroupOptions} person={currentPerson} close={close} onChange={onChange}/>}
				{context === 'new' && <EditPerson workingGroupOptions={workingGroupOptions} person={null} close={close} onChange={onChange}/>}
			</VerticalBar.ScrollableContent>
		</VerticalBar>}
	</Page>;
}

PersonsPage.displayName = 'PersonsPage';

export default PersonsPage;

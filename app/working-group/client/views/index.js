import React, { useCallback, useMemo, useState } from 'react';
import { ButtonGroup, Button, Field, Box, Label, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useMethod } from '../../../../client/contexts/ServerContext';

import { WorkingGroups } from './WorkingGroups';
import { AddWorkingGroup } from './AddWorkingGroup';
import { EditWorkingGroup } from './EditWorkingGroup';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

export const useQueryUser = ({ text, itemsPerPage, current }, [ column, direction ], cache) => useMemo(() => ({
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	query: JSON.stringify({ workingGroup: { $regex: text || '', $options: 'i' } }),
	fields: JSON.stringify({ emails: 1, surname: 1, name: 1, patronymic: 1, position: 1, organization: 1, phone: 1, workingGroup: 1 }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
	// TODO: remove cache. Is necessary for data invalidation
}), [text, itemsPerPage, current, column, direction, cache]);

export function WorkingGroupPage() {
	const t = useTranslation();
	const routeName = 'working-group';

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['_id']);
	const [cache, setCache] = useState();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const queryUser = useQueryUser(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('users.list', queryUser) || {};

	const router = useRoute(routeName);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const downloadWorkingGroupParticipantsMethod = useMethod('downloadWorkingGroupParticipants');

	const downloadWorkingGroupParticipants = (workingGroup) => async (e) => {
		e.preventDefault();
		try {
			const res = await downloadWorkingGroupParticipantsMethod({ workingGroup });
			const url = window.URL.createObjectURL(new Blob([res]));
			const link = document.createElement('a');
			link.href = url;
			const fileName = 'Списки рабочей группы от ' + moment(new Date()).format('DD MMMM YYYY') + '.docx';
			link.setAttribute('download', fileName);
			document.body.appendChild(link);
			link.click();
		} catch (e) {
			console.error('[index.js].downloadCouncilParticipants :', e);
		}
	};

	const onClick = useCallback(() => {
		//FlowRouter.go(`/composition-of-the-working-group`);
	}, []);

	const onPinnedFilesClick = useCallback(() => {
		//FlowRouter.go('/composition-of-the-working-group');
	}, []);

	const onEditClick = useCallback((_id) => () => {
		router.push({
			context: 'edit',
			id: _id,
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
					<Label fontScale='h1'>{t('Working_group')}</Label>
				</Field>
			</Page.Header>
			<Page.Content>
				<Field.Row>
					<ButtonGroup>
						{/*<Button small aria-label={t('Pinned_files')} onClick={onPinnedFilesClick}>*/}
						{/*	<Box is='span' fontScale='p1'>{t('Working_group_meeting_pinned_files')}</Box>*/}
						{/*</Button>*/}
						{/*<Button small aria-label={t('Add_User')} onClick={handleHeaderButtonClick('new')}>*/}
						{/*	<Box is='span' fontScale='p1'>{t('Working_group_add')}</Box>*/}
						{/*</Button>*/}
						<Button small primary onClick={downloadWorkingGroupParticipants(data.users)} aria-label={t('Download')}>
							<Box is='span' fontScale='p1'>{t('Download_Council_Participant_List')}</Box>
						</Button>
					</ButtonGroup>
				</Field.Row>
				<WorkingGroups setParam={setParams} params={params} onHeaderClick={onHeaderClick} userData={data} onEditClick={onEditClick} onClick={onClick} sort={sort}/>
			</Page.Content>
		</Page>
		{ context
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'edit' && t('Working_group_edit') }
				{ context === 'new' && t('Working_group_add') }
				<VerticalBar.Close onClick={close}/></VerticalBar.Header>
			<VerticalBar.Content>
				{context === 'edit' && <EditWorkingGroup _id={id} close={close} onChange={onChange} cache={cache}/>}
				{context === 'new' && <AddWorkingGroup goToNew={onEditClick} close={close} onChange={onChange}/>}
			</VerticalBar.Content>
		</VerticalBar>}
	</Page>;
}

WorkingGroupPage.displayName = 'WorkingGroupPage';

export default WorkingGroupPage;

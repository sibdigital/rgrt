import React, { useCallback, useMemo, useState } from 'react';
import { Button, Field, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { WorkingGroups } from './WorkingGroups';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useMethod } from '../../../../client/contexts/ServerContext';

import { AddWorkingGroup } from './AddWorkingGroup';
import { EditWorkingGroup } from './EditWorkingGroup';
import moment from 'moment';

const sortDir = (sortDir) => (sortDir === 'workingGroupType' ? 1 : -1);

export const useQuery = (params, sort) => useMemo(() => ({
	sort: JSON.stringify({ [sort[0]]: sortDir(sort[1]) }),
	...params.itemsPerPage && { count: params.itemsPerPage },
	...params.current && { offset: params.current },
}), [JSON.stringify(params), JSON.stringify(sort)]);

export function WorkingGroupPage() {
	const t = useTranslation();
	const routeName = 'working-group';

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['workingGroupType']);
	const [cache, setCache] = useState();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort);

	const data = useEndpointData('working-groups.list', query) || {};

	const router = useRoute(routeName);

	const mobile = useMediaQuery('(max-width: 420px)');
	const small = useMediaQuery('(max-width: 780px)');

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

	const onClick = (_id) => () => {
		//FlowRouter.go(`/working-group/${ _id }`);
	};

	const onEditClick = (_id) => () => {
		router.push({
			context: 'edit',
			id: _id,
		});
	};

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;
		if (sortBy === id) {
			setSort([id]);
			return;
		}
		setSort(['workingGroupType']);
	};

	const handleHeaderButtonClick = useCallback((context) => () => {
		router.push({ context });
	}, [router]);

	const close = () => {
		router.push({});
	};

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Working_group')}>
			</Page.Header>
			<Page.Content>
				<Field.Row>
					<Field.Label>{t('Council_Invited_Users')}</Field.Label>
					<Button small aria-label={t('Add_User')} onClick={handleHeaderButtonClick('new')}>
						{t('Working_group_add')}
					</Button>
					<Button small onClick={downloadWorkingGroupParticipants(data.workingGroups)} aria-label={t('Download')}>
						{t('Download_Council_Participant_List')}
					</Button>
				</Field.Row>
				<WorkingGroups setParam={setParams} params={params} onHeaderClick={onHeaderClick} data={data.workingGroups} onEditClick={onEditClick} onClick={onClick} sort={sort}/>
			</Page.Content>
		</Page>
		{ context
		&& <VerticalBar mod-small={small} mod-mobile={mobile} style={{ width: '378px' }} qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
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

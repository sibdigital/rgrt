import React, { useCallback, useMemo, useState } from 'react';
import { Button, Field, Icon, Label } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { WorkingGroupsMeetings } from './workingGroupMeetings';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { EditWorkingGroupMeeting } from './EditWorkingGroupMeeting';
import { AddWorkingGroupMeeting } from './AddWorkingGroupMeeting';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

export const useQuery = ({ text, itemsPerPage, current }, [ column, direction ], cache) => useMemo(() => ({
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
	// TODO: remove cache. Is necessary for data invalidation
}), [text, itemsPerPage, current, column, direction, cache]);

export function WorkingGroupMeetingsPage() {
	const t = useTranslation();
	const routeName = 'working-group-meetings';

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['d']);
	const [cache, setCache] = useState();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('working-group-meetings.list', query) || {};
	//const data = useEndpointData('councils.list', query) || { result: [] };
	console.log(data);
	const router = useRoute(routeName);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const onClick = (_id) => () => {
		FlowRouter.go(`/working-group-meeting/${ _id }`);
	};

	const onEditClick = useCallback((_id) => () => {
		router.push({
			context: 'edit',
			id: _id,
		});
	}, [router]);

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;
		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'd' : 'asc']);
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
					<Label fontScale='h1'>{t('Working_group_meetings')}</Label>
				</Field>
			</Page.Header>
			<Page.Content>
				<Field.Row>
					<Field.Label>{t('Working_group_meeting_list')}</Field.Label>
					<Button small primary aria-label={t('Working_group_meeting_add')} onClick={handleHeaderButtonClick('new')}>
						{t('Working_group_meeting_add')}
					</Button>
				</Field.Row>
				<WorkingGroupsMeetings setParam={setParams} params={params} onHeaderClick={onHeaderClick} data={data.workingGroupMeetings} onEditClick={onEditClick} onClick={onClick} sort={sort}/>
			</Page.Content>
		</Page>
		{ context
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'edit' && t('Working_group_edit') }
				{ context === 'new' && t('Working_group_add') }
				<VerticalBar.Close onClick={close}/></VerticalBar.Header>
			<VerticalBar.Content>
				{context === 'edit' && <EditWorkingGroupMeeting _id={id} close={close} onChange={onChange} cache={cache}/>}
				{context === 'new' && <AddWorkingGroupMeeting goToNew={onEditClick} close={close} onChange={onChange}/>}
			</VerticalBar.Content>
		</VerticalBar>}
	</Page>;
}

WorkingGroupMeetingsPage.displayName = 'WorkingGroupMeetingsPage';

export default WorkingGroupMeetingsPage;

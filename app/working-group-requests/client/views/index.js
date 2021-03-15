import React, { useCallback, useMemo, useState } from 'react';
import { ButtonGroup, Button, Field, Label, Icon, Callout } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { Requests } from './requests';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { hasPermission } from '../../../authorization';
import { useUserId } from '../../../../client/contexts/UserContext';
import { FlowRouter } from 'meteor/kadira:flow-router';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

export const useQuery = ({ itemsPerPage, current }, [column, direction], cache) => useMemo(() => ({
	query: JSON.stringify({ _id: { $regex: '', $options: 'i' } }),
	sort: JSON.stringify({ ts: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [itemsPerPage, current, column, direction, cache]);

export function WorkingGroupRequestsPage() {
	const t = useTranslation();
	const routeName = 'working-groups-requests';
	const userId = useUserId();
	console.log('working-groups-requests');

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['_id']);
	const [cache, setCache] = useState();
	const [currentRequestToEdit, setCurrentRequestToEdit] = useState({});

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const mediaQuery = useMediaQuery('(min-width: 520px)');

	const data = useEndpointData('working-groups-requests.list', query) || {};
	const docsdata = data.requests ?? [];
	console.log(data);
	console.log(docsdata);

	const router = useRoute(routeName);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const onClick = (_id) => () => {
		FlowRouter.go(`/working-groups-request/${ _id }`);
	};

	const onPinnedFilesClick = useCallback(() => {
		//FlowRouter.go('/composition-of-the-working-group');
	}, []);

	const onEditClick = useCallback((_id) => () => {
		const request = docsdata.find((request) => request._id === _id);
		console.log(data);
		console.log(docsdata);
		console.log(request);
		console.log(_id);
		setCurrentRequestToEdit(request);
		FlowRouter.go(`/working-groups-request/${ _id }/edit`);
	}, [router, currentRequestToEdit, docsdata]);

	const handleHeaderButtonClick = useCallback(() => {
		FlowRouter.go('/working-groups-request/add/new');
	}, []);	

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;
		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'workingGroup' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	};

	const close = useCallback(() => {
		router.push({});
	}, [router]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const goBack = () => {
		FlowRouter.go('home');
	};

	if (!hasPermission('manage-working-group-requests', userId)) {
		console.log('Permissions_access_missing');
		return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	}

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton onClick={goBack}/>
					<Label fontScale={mediaQuery ? 'h1' : 'h2'}>
						{(context === undefined || context === 'requests') && t('Working_group_requests')}
						{(context === 'new' || context === 'new-protocols-item-request') && t('Working_group_request_add')}
						{context === 'edit' && t('Working_group_request_edit')}
					</Label>
				</Field>
				{(context === undefined || context === 'requests') && <ButtonGroup>
					<Button small primary aria-label={t('Add')} onClick={handleHeaderButtonClick}>
						{t('Add')}
					</Button>
				</ButtonGroup>
				}
			</Page.Header>
			<Page.Content>
				{<Requests setParam={setParams} params={params} onHeaderClick={onHeaderClick} data={docsdata} onEditClick={onEditClick} onClick={onClick} sort={sort}/>}
			</Page.Content>
		</Page>
		{/* {(context === 'new' || context === 'edit' || context === 'new-protocols-item-request')
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ (context === 'new' || context === 'new-protocols-item-request') && t('Add') }
				{ context === 'edit' && t('Edit') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			{(context === 'new' || context === 'new-protocols-item-request') && <AddRequest onChange={onChange} docsdata={docsdata}/>}
			{context === 'edit' && <AddRequest onChange={onChange} editData={currentRequestToEdit}/>}
		</VerticalBar>} */}
	</Page>;
}

WorkingGroupRequestsPage.displayName = 'WorkingGroupRequestsPage';

export default WorkingGroupRequestsPage;

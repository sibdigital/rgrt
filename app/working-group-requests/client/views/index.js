import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ButtonGroup, Button, Field, Label, Icon, Callout } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { Requests } from './requests';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { hasPermission } from '../../../authorization';
import { useUserId } from '../../../../client/contexts/UserContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

export const useQuery = ({ itemsPerPage, current }, [column, direction], cache) => useMemo(() => ({
	query: JSON.stringify({ _id: { $regex: '', $options: 'i' } }),
	sort: JSON.stringify({ ts: sortDir(direction) }),
	fields: JSON.stringify({ answers: 0 }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
	cache,
}), [direction, itemsPerPage, current, cache]);

export function WorkingGroupRequestsPage() {
	const t = useTranslation();
	const routeName = 'working-groups-requests';
	const userId = useUserId();
	const canAddRequest = hasPermission('manage-working-group-requests', userId);
	const dispatchToastMessage = useToastMessageDispatch();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['_id']);
	const [cache, setCache] = useState(new Date());
	const [currentRequestToEdit, setCurrentRequestToEdit] = useState({});

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const mediaQuery = useMediaQuery('(min-width: 520px)');

	const data = useEndpointData('working-groups-requests.list', query);
	const docsData = useMemo(() => data?.requests ?? [], [data]);

	const router = useRoute(routeName);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const deleteWorkingGroupRequest = useMethod('deleteWorkingGroupRequest');

	const onClick = (_id) => () => {
		FlowRouter.go(`/working-groups-request/${ _id }`);
	};

	const onDeleteClick = useCallback((_id) => async () => {
		try {
			await deleteWorkingGroupRequest(_id);
			dispatchToastMessage({ type: 'success', message: t('Working_group_request_deleted') });
			setCache(new Date());
		} catch (error) {
			console.error(error);
		}
	}, [deleteWorkingGroupRequest, dispatchToastMessage, t]);

	const onEditClick = useCallback((_id) => () => {
		const request = docsData.find((request) => request._id === _id);
		setCurrentRequestToEdit(request);
		FlowRouter.go(`/working-groups-request/${ _id }/edit`);
	}, [docsData]);

	const handleHeaderButtonClick = useCallback(() => {
		FlowRouter.go('working-groups-request-new');
	}, []);

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;
		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'workingGroup' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	};

	const goBack = () => {
		FlowRouter.go('home');
	};

	// if (!hasPermission('manage-working-group-requests', userId)) {
	// 	console.log('Permissions_access_missing');
	// 	return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	// }

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
				{(context === undefined || context === 'requests') && canAddRequest && <ButtonGroup>
					<Button small primary aria-label={t('Add')} onClick={handleHeaderButtonClick}>
						{t('Add')}
					</Button>
				</ButtonGroup>
				}
			</Page.Header>
			<Page.Content>
				{<Requests setParam={setParams} params={params} onHeaderClick={onHeaderClick} data={docsData} onDeleteClick={onDeleteClick} onEditClick={onEditClick} onClick={onClick} sort={sort}/>}
			</Page.Content>
		</Page>
	</Page>;
}

WorkingGroupRequestsPage.displayName = 'WorkingGroupRequestsPage';

export default WorkingGroupRequestsPage;

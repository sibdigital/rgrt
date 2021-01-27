import React, { useCallback, useMemo, useState } from 'react';
import { Button, Field, Icon, Label } from '@rocket.chat/fuselage';

import Page from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import VerticalBar from '../../../../../client/components/basic/VerticalBar';
import { GoBackButton } from '../../../../utils/client/views/GoBackButton';

import { WorkingGroupCompositions } from './WorkingGroupCompositions';
import { AddWorkingGroupComposition } from './AddWorkingGroupComposition';
import { EditWorkingGroupComposition } from './EditWorkingGroupComposition';

export function CompositionOfTheWorkingGroupPage() {
	const routeName = 'composition-of-the-working-group';
	const t = useTranslation();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [cache, setCache] = useState();

	const router = useRoute(routeName);
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: { $regex: '', $options: 'i' } }),
	}), [cache]);

	const data = useEndpointData('working-groups.list', query) || { result: [] };

	const [workingGroupCompositionCount, setWorkingGroupCompositionCount] = useState(-1);

	if (!data.workingGroups) {
		data.workingGroups = [];
	}

	if (data.total && workingGroupCompositionCount === -1) {
		setWorkingGroupCompositionCount(data.total);
	}

	const handleHeaderButtonClick = useCallback((context) => () => {
		router.push({ context });
	}, [router]);

	const handleAdded = useCallback(() => {
		setWorkingGroupCompositionCount(workingGroupCompositionCount + 1);
	}, [workingGroupCompositionCount, setWorkingGroupCompositionCount]);

	const close = useCallback(() => {
		router.push({});
	}, [router]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const onEditClick = useCallback((_id) => () => {
		router.push({
			context: 'edit',
			id: _id,
		});
	}, [router]);

	const goBack = () => {
		window.history.back();
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Working_group_composition')}</Label>
				</Field>
			</Page.Header>
			<Page.Content>
				<Field mbe='x8'>
					<Field.Label>{t('Working_group_composition_count')}: {workingGroupCompositionCount === -1 ? 0 : workingGroupCompositionCount}</Field.Label>
				</Field>
				<Field mbe='x8' display={'block'}>
					<Button small primary onClick={handleHeaderButtonClick('new')} aria-label={t('Working_group_composition_add')}>
						{t('Working_group_composition_add')}
					</Button>
				</Field>
				<WorkingGroupCompositions data={data.workingGroups} setParams={setParams} params={params} onEditClick={onEditClick} onChange={onChange}/>
			</Page.Content>
		</Page>
		{ context
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'edit' && t('Working_group_type_edit') }
				{ context === 'new' && t('Working_group_type_add') }
				<VerticalBar.Close onClick={close}/></VerticalBar.Header>
			<VerticalBar.Content>
				{context === 'edit' && <EditWorkingGroupComposition _id={id} close={close} onChange={onChange} cache={cache}/>}
				{context === 'new' && <AddWorkingGroupComposition goToNew={handleAdded} close={close} onChange={onChange}/>}
			</VerticalBar.Content>
		</VerticalBar>}
	</Page>;
}

CompositionOfTheWorkingGroupPage.displayName = 'CompositionOfTheWorkingGroupPage';

export default CompositionOfTheWorkingGroupPage;

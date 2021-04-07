import React, { useEffect, useMemo, useState } from 'react';
import {
	Button,
	Field,
	Icon,
	Label,
	Table,
	TextInput,
	TextAreaInput,
	Box,
	Skeleton, Callout,
} from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { Th } from '../../../../client/components/GenericTable';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { hasPermission } from '../../../authorization';
import { useUserId } from '../../../../client/contexts/UserContext';
import { ErrandByRequestFields } from '../../../errand/client/views/errandsPage/ErrandFields';
import { useDefaultErrandForm } from '../../../errand/client/views/errandsPage/ErrandForm';
import { ErrandTypes } from '../../../errand/client/utils/ErrandTypes';

export function AnswerPage() {
	const t = useTranslation();
	const requestId = useRouteParameter('requestid');
	const mailId = useRouteParameter('mailid');
	const answerId = useRouteParameter('answerid');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: requestId, mailId, answerId }),
	}), [answerId, mailId, requestId]);

	const data = useEndpointData('working-groups-requests.findAnswerOneById', query);

	// const filesQuery = useMemo(() => ({ query: JSON.stringify({ _id: data ? { $in: data.documents?.map((doc) => doc._id ?? '') } : {} }) }), [data]);

	// const { data: files, state, error } = useEndpointDataExperimental('upload-files.list', filesQuery);
	const { data: errand, state: errandState, error: errandError } = useEndpointDataExperimental('errands.findOne', useMemo(() => ({
		query: JSON.stringify({ _id: answerId }),
	}), [answerId]));

	if (!hasPermission('manage-working-group-requests', useUserId())) {
		console.log('Permissions_access_missing');
		return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	}

	if ([errandState].includes(ENDPOINT_STATES.LOADING)) {
		return <Box w='full' pb='x24'>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (errandState === ENDPOINT_STATES.ERROR) {
		return <Callout m='x16' type='danger'>{t(errandError.message)}</Callout>;
	}

	return <AnswerWithData answer={data} requestId={requestId} mailId={mailId} answerId={answerId} errand={errand}/>;
}

AnswerPage.displayName = 'AnswerPage';

export default AnswerPage;

function AnswerWithData({ errand, onReadOnly = false }) {
	const t = useTranslation();

	const [items, setItems] = useState([]);
	const [_onReadOnly, setOnReadOnly] = useState(onReadOnly);

	const inputStyles = useMemo(() => ({ wordBreak: 'break-word', whiteSpace: 'pre-wrap', border: _onReadOnly ? '' : '1px solid #4fb0fc' }), [_onReadOnly]);

	const { values, handlers } = useDefaultErrandForm({ defaultValues: errand, errandType: ErrandTypes.byRequestAnswer });

	useEffect(() => {
		if (errand && errand._id) {
			setItems(errand.sectionItemsId ?? []);
		}
	}, [errand]);

	useMemo(() => console.dir({ errandInAnswer: errand, values }), [errand, values]);

	return <Page>
		<Page.Header title=''>
			<Field width={'100%'} display={'block'} marginBlock={'15px'}>
				<GoBackButton/>
				<Label fontScale='h1'>{t('Working_group_received_answer')}</Label>
			</Field>
		</Page.Header>
		<Page.ScrollableContent>
			<ErrandByRequestFields values={values} handlers={handlers} items={items} setItems={setItems} inputStyles={inputStyles} request={{}} setContext={(context) => context}/>
		</Page.ScrollableContent>
	</Page>;
}

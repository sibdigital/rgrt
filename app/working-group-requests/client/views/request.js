import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, ButtonGroup, Callout, Field, Icon, Label, TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import { settings } from '../../../settings/client';
import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { Answers } from './Answers';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { hasPermission } from '../../../authorization';
import { useUserId } from '../../../../client/contexts/UserContext';
import { createWorkingGroupRequestData, validateWorkingGroupRequestData } from './lib';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import RequestForm, { useDefaultRequestForm, WorkingGroupRequestVerticalChooseBar } from './RequestForm';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

export function DocumentPage() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const formatDateAndTime = useFormatDateAndTime();

	const [cache, setCache] = useState(new Date());
	const [context, setContext] = useState('');
	const [protocolsItemId, setProtocolsItemId] = useState(null);

	const { values, handlers, hasUnsavedChanges } = useDefaultRequestForm({ defaultValues: null });

	const requestId = useRouteParameter('id');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: requestId }),
		cache: JSON.stringify({ cache }),
	}), [requestId, cache]);

	const { data } = useEndpointDataExperimental('working-groups-requests.findOne', query);

	const { data: councilData, state: councilState } = useEndpointDataExperimental('councils.findOne',
		useMemo(() => ({
			query: JSON.stringify({ _id: data?.councilId ?? '' }),
			fields: JSON.stringify({ d: 1 }),
		}), [data]),
	);

	const { data: protocolData, state: protocolState } = useEndpointDataExperimental('protocols.findOne',
		useMemo(() => ({
			query: JSON.stringify({ _id: data?.protocolId ?? '' }),
			fields: JSON.stringify({ num: 1, d: 1 }),
		}), [data]),
	);

	const { data: protocolItemsData, state: protocolItemsState } = useEndpointDataExperimental('protocols.getProtocolItemsByProtocolId',
		useMemo(() => ({
			query: JSON.stringify({ _id: data?.protocolId ?? '', protocolsItems: data?.protocolItemsId ?? [] }),
		}), [data]),
	);

	const insertOrUpdateWorkingGroupRequest = useMethod('insertOrUpdateWorkingGroupRequest');

	const {
		handleNumber,
		handleDate,
		handleItemResponsible,
		handleMail,
		handleDescription,
		handleCouncil,
		handleProtocol,
		handleProtocolItems,
	} = handlers;

	useEffect(() => {
		if (data) {
			handleNumber && handleNumber(data.number ?? '');
			handleDate && handleDate(data.date ? new Date(data.date) : new Date());
			handleDescription && handleDescription(data.desc ?? '');
			handleItemResponsible && handleItemResponsible(data.itemResponsible ?? '');
			handleMail && handleMail(data.mail ?? '');
			handleProtocolItems && handleProtocolItems(data.protocolItems ?? []);
			data.protocolsItemId && setProtocolsItemId(data.protocolsItemId);
		}
	}, [data]);

	useEffect(() => {
		if (councilData) {
			console.dir({ councilData });
			handleCouncil && handleCouncil(councilData ?? {});
		}
	}, [councilData]);

	useEffect(() => {
		if (protocolData) {
			console.dir({ protocolData });
			handleProtocol && handleProtocol(protocolData ?? {});
		}
	}, [protocolData]);

	useEffect(() => {
		if (protocolItemsData) {
			handleProtocolItems && handleProtocolItems(protocolItemsData.items ?? []);
		}
	}, [protocolItemsData]);

	const answers = useMemo(() => data?.answers ?? [], [data]);

	const address = useMemo(() => [settings.get('Site_Url'), 'd/', data?.inviteLink ?? ''].join(''), [data]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const onMailClick = useCallback((curMail) => () => {
		FlowRouter.go(`/working-groups-request/${ requestId }/answer/${ curMail._id }`);
	}, [requestId]);

	const goBack = () => {
		FlowRouter.go('working-groups-requests');
	};

	const saveAction = useCallback(async ({
		number,
		date,
		council,
		protocol,
		protocolItemsId,
		itemResponsible,
		mail,
		description,
		protocolsItemId,
	}) => {
		const requestData = createWorkingGroupRequestData({
			number,
			date,
			council,
			protocol,
			protocolItemsId,
			itemResponsible,
			mail,
			desc: description,
			protocolsItemId,
			previousData: { _id: requestId },
		});
		console.log({ requestData });
		const validation = validateWorkingGroupRequestData(requestData);
		console.log({ validation });
		if (validation.length === 0) {
			await insertOrUpdateWorkingGroupRequest(requestData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [insertOrUpdateWorkingGroupRequest, t]);

	const handleSaveRequest = useCallback(async () => {
		try {
			await saveAction({
				number: values.number,
				date: values.date,
				council: values.council,
				protocol: values.protocol,
				protocolItemsId: values.protocolItemsId,
				itemResponsible: values.itemResponsible,
				mail: values.mail,
				description: values.description,
				protocolsItemId,
			});

			dispatchToastMessage({
				type: 'success',
				message: t('Working_group_request_added'),
			});

			FlowRouter.go('working-groups-requests');
		} catch (error) {
			dispatchToastMessage({
				type: 'error',
				message: error,
			});
		}
	}, [saveAction, values, protocolsItemId, t, dispatchToastMessage]);


	if (!hasPermission('manage-working-group-requests', useUserId())) {
		console.log('Permissions_access_missing');
		return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	}

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title=''>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton onClick={goBack}/>
					<Label fontScale='h1'>{t('Working_group_request')}</Label>
				</Field>
				<ButtonGroup>
					<Button disabled={!hasUnsavedChanges} primary small aria-label={t('Save')} onClick={handleSaveRequest}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContent padding='x24'>
				{/* eslint-disable-next-line react-hooks/rules-of-hooks */}
				{useMemo(() =>
					<RequestForm defaultValues={values} defaultHandlers={handlers} setContext={setContext}/>
				, [setContext, handlers, values])}
				<Field mbe='x16'>
					<Field.Label>{t('Working_group_request_invite_link')}</Field.Label>
					<Field.Row>
						<a href={address} is='span' target='_blank'>{address}</a>
					</Field.Row>
				</Field>
				<Answers mail={data} onClick={onMailClick} editData={answers} onChange={onChange}/>
			</Page.ScrollableContent>
		</Page>

		{/* eslint-disable-next-line react-hooks/rules-of-hooks */}
		{useMemo(() => <WorkingGroupRequestVerticalChooseBar
			handlers={handlers}
			close={() => setContext('')}
			context={context}
			protocolId={values.protocol?._id ?? ''}
			protocolItems={values.protocolItems ?? []}
		/>, [context, handlers, values.protocol, values.protocolItems])}
	</Page>;
}

DocumentPage.displayName = 'DocumentPage';

export default DocumentPage;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, ButtonGroup, Box, Field, Label } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import { settings } from '../../../settings/client';
import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { Answers } from './Answers';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { hasPermission } from '../../../authorization';
import { useUserId } from '../../../../client/contexts/UserContext';
import { createWorkingGroupRequestData, validateWorkingGroupRequestData } from './lib';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import RequestForm, { useDefaultRequestForm, WorkingGroupRequestVerticalChooseBar } from './RequestForm';
import { ErrandTypes } from '../../../errand/client/utils/ErrandTypes';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

export function DocumentPage() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const userId = useUserId();

	const canSaveRequest = hasPermission('manage-working-group-requests', userId);

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

	const { data: protocolItemsData, state: protocolItemsState } = useEndpointDataExperimental('protocols.getProtocolItemsByItemsId',
		useMemo(() => ({
			query: JSON.stringify({ _id: data?.protocolId ?? '', protocolItemsId: data?.protocolItemsId ?? [] }),
		}), [data]),
	);

	const { data: errandsData } = useEndpointDataExperimental('errands.list',
		useMemo(() => ({
			query: JSON.stringify({ workingGroupRequestId: requestId }),
		}), [requestId]),
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
		handleRequestType,
	} = handlers;

	useEffect(() => {
		if (data) {
			handleNumber && handleNumber(data.number ?? '');
			handleDate && handleDate(data.date ? new Date(data.date) : new Date());
			handleDescription && handleDescription(data.desc ?? '');
			handleItemResponsible && handleItemResponsible(data.itemResponsible ?? '');
			handleMail && handleMail(data.mail ?? '');
			handleProtocolItems && handleProtocolItems(data.protocolItems ?? []);
			handleRequestType && handleRequestType(data.requestType ?? 1);
			data.protocolsItemId && setProtocolsItemId(data.protocolsItemId);
		}
	}, [data]);

	useEffect(() => {
		if (councilData && councilData._id) {
			console.dir({ councilData });
			handleCouncil && handleCouncil(councilData ?? {});
		}
	}, [councilData]);

	useEffect(() => {
		if (protocolData && protocolData._id) {
			console.dir({ protocolData });
			handleProtocol && handleProtocol(protocolData ?? {});
		}
	}, [protocolData]);

	useEffect(() => {
		if (protocolItemsData && protocolItemsData.items && protocolItemsData.items.length > 0) {
			handleProtocolItems && handleProtocolItems(protocolItemsData.items ?? []);
		}
	}, [protocolItemsData]);

	// const answers = useMemo(() => data?.answers ?? [], [data]);
	const answers = useMemo(() => errandsData?.errands ?? [], [errandsData]);

	const address = useMemo(() => [settings.get('Site_Url'), `errand/add&${ ErrandTypes.byRequestAnswer.key }&${ requestId }/newAnswer`].join(''), [requestId]);
	const addressLabel = useMemo(() => [settings.get('Site_Url'), 'd/', data?.inviteLink ?? ''].join(''), [data]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const onMailClick = useCallback((errandId) => () => {
		// FlowRouter.go(`/working-groups-request/${ requestId }/answer/${ errandId }`);
		FlowRouter.go(`/errand/${ errandId }`);
	}, []);

	const goBack = () => {
		FlowRouter.go('working-groups-requests');
	};

	const saveAction = useCallback(async ({
		number,
		date,
		council,
		protocol,
		protocolItems,
		itemResponsible,
		mail,
		description,
		protocolsItemId,
		councilId,
		protocolId,
		requestType,
	}) => {
		const requestData = createWorkingGroupRequestData({
			number,
			date,
			council,
			protocol,
			protocolItemsId: protocolItems?.map((protocolItem) => protocolItem._id) ?? [],
			itemResponsible,
			mail,
			desc: description,
			protocolsItemId,
			previousData: { _id: requestId },
			councilId,
			protocolId,
			requestType,
		});
		console.log({ requestData });
		const validation = validateWorkingGroupRequestData(requestData);
		console.log({ validation });
		if (validation.length === 0) {
			await insertOrUpdateWorkingGroupRequest(requestData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [insertOrUpdateWorkingGroupRequest, requestId, t]);

	const handleSaveRequest = useCallback(async () => {
		try {
			const { protocol } = values;
			values.protocolItems?.length > 0 && values.protocolItems[0].num && console.dir({ itemInSave: values.protocolItems[0] });
			values.protocolItems?.length > 0 && values.protocolItems[0].num
			&& Object.assign(protocol, { sectionId: values.protocolItems[0].sectionId ?? '', itemId: values.protocolItems[0]._id, itemName: values.protocolItems[0].name, itemNum: values.protocolItems[0].num });

			await saveAction({
				number: values.number,
				date: values.date,
				council: values.council,
				protocol,
				protocolItems: values.protocolItems,
				itemResponsible: values.itemResponsible,
				mail: values.mail,
				description: values.description,
				protocolsItemId,
				councilId: values.council?._id,
				protocolId: values.protocol?._id,
				requestType: values.requestType,
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

	useMemo(() => console.dir({ canSaveRequest }), [canSaveRequest]);
	return <Page flexDirection='row'>
		<Page>
			<Page.Header title=''>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton onClick={goBack}/>
					<Label fontScale='h1'>{t('Working_group_request')}</Label>
				</Field>
				<ButtonGroup>
					{ canSaveRequest && <Button disabled={!hasUnsavedChanges} primary small aria-label={t('Save')} onClick={handleSaveRequest}>
						{t('Save')}
					</Button>}
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContent padding='x24'>
				{/* eslint-disable-next-line react-hooks/rules-of-hooks */}
				{useMemo(() =>
					<RequestForm defaultValues={values} defaultHandlers={handlers} setContext={setContext} isCanSaveRequest={canSaveRequest}/>
				, [setContext, handlers, values])}
				<Field mbe='x16'>
					<Field.Label>{t('Working_group_request_invite_link')}</Field.Label>
					<Field.Row>
						<a href={address} is='span'>{addressLabel}</a>
					</Field.Row>
				</Field>
				<Box displa='flex' maxHeight='600px'>
					<Answers mail={data} onClick={onMailClick} editData={answers} onChange={onChange}/>
				</Box>
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

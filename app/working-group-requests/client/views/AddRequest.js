/* eslint-disable react-hooks/rules-of-hooks */
import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
	Button,
	ButtonGroup,
	Field,
	Label,
} from '@rocket.chat/fuselage';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { createWorkingGroupRequestData, validateWorkingGroupRequestData } from './lib';
import { constructPersonFIO } from '../../../utils/client/methods/constructPersonFIO';
import RequestForm, { useDefaultRequestForm, WorkingGroupRequestVerticalChooseBar } from './RequestForm';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

function GetDataFromProtocolItem({ protocolsItemId = null, workingGroupRequestContext = null, handlers }) {
	if (!protocolsItemId || workingGroupRequestContext.toString() !== 'new-protocols-item-request') {
		console.log('new-protocols-item-request cancel');
		return {};
	}
	const { data: workingGroupRequestData } = useEndpointDataExperimental('working-groups-requests.findByProtocolsItemId', useMemo(() => ({
		query: JSON.stringify({ protocolsItemId }),
	}), [protocolsItemId]));

	useMemo(() => workingGroupRequestData?._id && FlowRouter.go(`/working-groups-request/${ workingGroupRequestData._id }`), [workingGroupRequestData]);

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: protocolsItemId }),
	}), [protocolsItemId]);

	const { data: protocolData } = useEndpointDataExperimental('protocols.findByItemId', query);
	const { data: councilData } = useEndpointDataExperimental('councils.findOne', useMemo(() => ({
		query: JSON.stringify({ _id: protocolData?.protocol[0]?.council?._id ?? '' }),
		fields: JSON.stringify({ d: 1 }),
	}), [protocolData]));

	useEffect(() => {
		if (protocolData) {
			if (protocolData.sections && protocolData.protocol && protocolData.protocol[0]) {
				let protocolItem = null;
				protocolData.sections.forEach((section) => {
					const it = section.items.find((item) => item._id === protocolsItemId);
					if (it) {
						protocolItem = it;
					}
				});
				const itemDesc = $(protocolItem?.name ?? '').text();
				const itemResponsiblePerson = constructPersonFIO(protocolItem?.responsible[0] ?? '');
				console.log({ protocolsItemId, protocolItem, itemDesc });

				itemDesc && handlers.handleDescription && handlers.handleDescription(itemDesc);
				protocolData && handlers.handleProtocol && handlers.handleProtocol({
					_id: protocolData.protocol[0]?._id,
					d: protocolData.protocol[0]?.d ?? new Date(),
					num: protocolData.protocol[0]?.num ?? '',
					itemNum: protocolItem?.num ?? '',
					itemResponsible: itemResponsiblePerson,
				});
				handlers && handlers.handleNumber && handlers.handleNumber(protocolData.protocol[0].num ?? '');
				itemResponsiblePerson && handlers.handleItemResponsible && handlers.handleItemResponsible(itemResponsiblePerson);
				handlers.handleProtocolItems && protocolData.sections.forEach((section) => section.items?.forEach((item) => item._id === protocolsItemId && handlers.handleProtocolItems([item])));
			}
		}
	}, [protocolData, protocolsItemId]);

	useEffect(() => {
		if (councilData) {
			handlers.handleCouncil && handlers.handleCouncil({ _id: councilData._id, d: councilData.d });
		}
	}, [councilData]);

	return { };
}

function NewAddRequest() {
	console.log('ADD REQUEST');
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const protocolsItemId = FlowRouter.getParam('id');
	const workingGroupRequestContext = FlowRouter.getParam('context');

	const [context, setContext] = useState('');

	const { values, handlers, allFieldAreFilled } = useDefaultRequestForm({ defaultValues: null });

	const insertOrUpdateWorkingGroupRequest = useMethod('insertOrUpdateWorkingGroupRequest');

	if (protocolsItemId && workingGroupRequestContext.toString() === 'new-protocols-item-request') {
		// eslint-disable-next-line new-cap
		GetDataFromProtocolItem({ protocolsItemId, workingGroupRequestContext, handlers });
	}

	const close = useCallback(() => setContext(''), []);

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
			councilId,
			protocolId,
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
			const { protocol } = values;
			values.protocolItems?.length > 0 && values.protocolItems[0].num && Object.assign(protocol, { itemNum: values.protocolItems[0].num });
			console.log({ protocol, items: values.protocolItems, check: values.protocolItems?.length > 0 && values.protocolItems[0].num });
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

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title=''>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Working_group_request')}</Label>
				</Field>
				<ButtonGroup mis='auto'>
					<Button disabled={!allFieldAreFilled} primary small aria-label={t('Save')} onClick={handleSaveRequest}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContent padding='x24'>
				{
					useMemo(() =>
						<RequestForm defaultHandlers={handlers} defaultValues={values} setContext={setContext}/>
					, [handlers, values])
				}
			</Page.ScrollableContent>
		</Page>
		{useMemo(() =>
			<WorkingGroupRequestVerticalChooseBar handlers={handlers} context={context} close={close} protocolId={values.protocol?._id ?? ''} protocolItems={values.protocolItems}/>
		, [close, context, handlers, values.protocol, values.protocolItems])}
	</Page>;
}

NewAddRequest.displayName = 'NewAddRequest';

export default NewAddRequest;

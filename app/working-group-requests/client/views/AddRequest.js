import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
	Button,
	ButtonGroup,
	Field,
	TextInput,
	TextAreaInput,
	Label,
	Select,
	Callout,
} from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useUserId } from '../../../../client/contexts/UserContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { hasPermission } from '../../../authorization';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { createWorkingGroupRequestData, validateWorkingGroupRequestData } from './lib';
import { constructPersonFIO } from '../../../utils/client/methods/constructPersonFIO';
import RequestForm, { useDefaultRequestForm, WorkingGroupRequestVerticalChooseBar } from './RequestForm';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

export function AddRequest() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const formatDate = useFormatDate();
	const formatDateAndTime = useFormatDateAndTime();

	const [cache, setCache] = useState();
	const [number, setNumber] = useState('');
	const [date, setDate] = useState(new Date());
	const [desc, setDesc] = useState('');
	const [council, setCouncil] = useState('');
	const [protocol, setProtocol] = useState('');
	const [protocolItem, setProtocolItem] = useState('');
	const [councilsOptions, setCouncilsOptions] = useState([]);
	const [protocolsOptions, setProtocolsOptions] = useState([]);
	const [protocolItemsOptions, setProtocolItemsOptions] = useState([]);

	const protocolItemId = useRouteParameter('id');

	const inputStyles = { wordBreak: 'break-word', whiteSpace: 'normal', border: '1px solid #4fb0fc' };
	const councilsList = useEndpointDataExperimental('councils.list') || { councils: [] };
	const protocolsList = useEndpointDataExperimental('protocols.list') || { protocols: [] };
	const { data: protocolData } = useEndpointDataExperimental('protocols.findByItemId', useMemo(() => ({query: JSON.stringify({ _id: protocolItemId }) }), [protocolItemId])) || { sections: [] };

	useEffect(() => {
		if (councilsList && councilsList.data) {
			let options = councilsList.data?.councils.map((council) => [council._id,
				t('Council').concat(' ').concat(t('Date_to')).concat(' ').concat(formatDateAndTime(council.d))]);

			setCouncilsOptions(options);
		}

		if (protocolsList && protocolsList.data) {
			let options = protocolsList.data?.protocols.map((protocol) => [protocol._id,
				t('Protocol').concat(' ').concat(t('Date_to')).concat(' ').concat(formatDate(protocol.d)).concat(' ').concat(' №').concat(protocol.num)]);

			setProtocolsOptions(options);
		}

		if (protocolItemId && protocolData?.protocol) {
			const protocolItem = protocolData.sections.map(section => section.items.filter(item => item._id === protocolItemId)[0])[0];

			setDesc($(protocolItem.name).text());
			setProtocol(protocolData.protocol[0]._id);
			setCouncil(protocolData.protocol[0].councilId);
		}
	}, [councilsList, protocolsList, protocolData])

	const onChange = useCallback(() => {
		console.log('onchange');
		setCache(new Date());
	}, [cache]);

	const goBack = () => {
		FlowRouter.go('working-groups-requests');
	};

	if (!hasPermission('manage-working-group-requests', useUserId())) {
		console.log('Permissions_access_missing');
		return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	}

	const insertOrUpdateWorkingGroupRequest = useMethod('insertOrUpdateWorkingGroupRequest');

	const saveAction = useCallback(async (number, desc, date, protocolsItemId) => {
		const requestData = createWorkingGroupRequestData(number, desc, date, protocolsItemId);
		const validation = validateWorkingGroupRequestData(requestData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateWorkingGroupRequest(requestData);
			return _id;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateWorkingGroupRequest, number, desc, date, t]);

	const handleSaveRequest = useCallback(async () => {
		const result = await saveAction(number, desc, date);
		if (result) {
			dispatchToastMessage({ type: 'success', message: t('Working_group_request_added') });
			FlowRouter.go(`/working-groups-request/${ result._id }`)
		}
	}, [saveAction, number, desc, date]);

	return <Page flexDirection='row'>
		{ <Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton onClick={goBack}/>
					<Label fontScale='h1'>{t('Working_group_request_add')}</Label>
				</Field>
				<ButtonGroup>
					<Button primary small aria-label={t('Save')} onClick={handleSaveRequest}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<Field mbs='x4' mbe='x16' display='flex' flexDirection='row'>
					<Field display='flex' flexDirection='row'>
						<Field.Label maxWidth='100px' alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Number')}</Field.Label>
						<TextInput value={ number } mie='x12' style={ inputStyles } placeholder={t('Number')} onChange={(e) => setNumber(e.currentTarget.value)} fontScale='p1'/>
					</Field>
					<Field mis='x4' display='flex' flexDirection='row'>
						<Field.Label alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Date')}</Field.Label>
						<DatePicker
							mie='x16'
							dateFormat='dd.MM.yyyy HH:mm'
							selected={date}
							onChange={(newDate) => setDate(newDate)}
							showTimeSelect
							timeFormat='HH:mm'
							timeIntervals={5}
							timeCaption='Время'
							customInput={<TextInput style={ inputStyles } />}
							locale='ru'
							popperClassName='date-picker'/>
					</Field>
				</Field>
				<Field mbs='x4' mbe='x16' display='flex' flexDirection='row'>
					<Field display='flex' flexDirection='row'>
						<Field.Label maxWidth='100px' alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Council')}</Field.Label>
						<Select mie='x16' style={ inputStyles } options={ councilsOptions } onChange={(val) => setCouncil(val)} value={ council } placeholder={t('Council')}/>
					</Field>
				</Field>
				<Field mbs='x4' mbe='x16' display='flex' flexDirection='row'>
					<Field display='flex' flexDirection='row'>
						<Field.Label maxWidth='100px' alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Protocol')}</Field.Label>
						<Select mie='x16' style={ inputStyles } options={ protocolsOptions } onChange={(val) => setProtocol(val)} value={ protocol } placeholder={t('Protocol')}/>
					</Field>
					<Field display='flex' flexDirection='row'>
						<Field.Label maxWidth='100px' alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Protocol_item')}</Field.Label>
						<Select mie='x16' style={ inputStyles } options={ protocolItemsOptions } onChange={(val) => setProtocolItem(val)} value={ protocolItem } placeholder={t('Protocol_item')}/>
					</Field>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput value={ desc } rows='3' style={ inputStyles } placeholder={t('Description')} onChange={(e) => setDesc(e.currentTarget.value)} fontScale='p1'/>
					</Field.Row>
				</Field>
			</Page.Content>
		</Page>}
	</Page>;
}

function GetDataFromProtocolItem({ protocolsItemId }) {
	const [description, setDescription] = useState(null);
	const [councilId, setCouncilId] = useState(null);
	const [itemResponsible, setItemResponsible] = useState(null);
	const [protocolRes, setProtocolRes] = useState({});
	const [councilRes, setCouncilRes] = useState({});

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
			console.dir({ protocolData, councilData });
			if (protocolData.protocol) {
				setCouncilId(protocolData.protocol[0]?.council?._id);
			}
			if (protocolData.sections) {
				const protocolItem = protocolData.sections.map((section) => section.items.filter((item) => item._id === protocolsItemId)[0])[0];
				const itemDesc = $(protocolItem?.name).text();
				const itemResponsiblePerson = constructPersonFIO(protocolItem?.responsible[0]);
				setDescription(itemDesc);
				setItemResponsible(itemResponsiblePerson);
				setProtocolRes({ d: protocolData.protocol[0]?.d, num: protocolData.protocol[0]?.num, itemNum: protocolItem.num, itemResponsible: itemResponsiblePerson });
			}
			if (protocolData.protocol && councilData) {
				setCouncilRes({ d: councilData.d });
			}
		}
	}, [protocolData, protocolsItemId, councilData]);

	return { description, councilId, itemResponsible, protocol: protocolRes.d ?? null, council: councilRes.d ?? null };
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

	useEffect(() => {
		if (protocolsItemId && workingGroupRequestContext === 'new-protocols-item-request') {
			// eslint-disable-next-line new-cap
			const { description, itemResponsible, protocol, council } = GetDataFromProtocolItem({ protocolsItemId });
			description && handlers.handleDescription && handlers.handleDescription(description);
			protocol && handlers.handleProtocol && handlers.handleProtocol(protocol);
			council && handlers.handleCouncil && handlers.handleCouncil(council);
			itemResponsible && handlers.handleItemResponsible && handlers.handleItemResponsible(itemResponsible);
		}
	}, [handlers, protocolsItemId, workingGroupRequestContext]);

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
				protocolItems: values.protocolItems,
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

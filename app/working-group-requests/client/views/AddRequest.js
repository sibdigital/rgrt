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
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { checkNumberWithDot } from '../../../utils/client/methods/checkNumber';
import { CouncilChoose } from './CouncilChoose';
import { ProtocolChoose } from './ProtocolChoose';
import { ItemsChoose } from './ItemsChoose';
import { constructPersonFIO } from '../../../utils/client/methods/constructPersonFIO';

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


function NewAddRequest({ mode, request, onChange, onRequestChanged, docsdata, ...props }) {
	console.log('ADD REQUEST');
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const formatDateAndTime = useFormatDateAndTime();

	const { _id, number: previousNumber, desc: previousDescription, date: previousDate } = request || {};
	const previousRequest = request || {};

	const [number, setNumber] = useState(previousNumber);
	const [description, setDescription] = useState(previousDescription);
	const [date, setDate] = useState(previousDate ? new Date(previousDate) : new Date());
	const [mail, setMail] = useState('');
	const [councilId, setCouncilId] = useState('');
	const [protocolId, setProtocolId] = useState('');
	const [protocolItemsId, setProtocolItemsId] = useState([]);
	const [itemResponsible, setItemResponsible] = useState('');
	const [context, setContext] = useState('');
	const [protocol, setProtocol] = useState({});
	const [council, setCouncil] = useState({});

	const protocolsItemId = FlowRouter.getParam('id');
	const workingGroupRequestContext = FlowRouter.getParam('context');

	if (protocolsItemId && workingGroupRequestContext === 'new-protocols-item-request') {
		const currentRequestQuery = docsdata?.filter(request => request.protocolsItemId === protocolsItemId)[0];

		if (currentRequestQuery) {
			FlowRouter.go(`/working-groups-request/${ currentRequestQuery._id }`);
		}

		const query = useMemo(() => ({
			query: JSON.stringify({ _id: protocolsItemId }),
		}), [protocolsItemId]);

		const { data: protocol } = useEndpointDataExperimental('protocols.findByItemId', query) || { sections: [] };
		const { data: council } = useEndpointDataExperimental('councils.list') || { councils: [] };

		useEffect(() => {
			console.log(protocol);
			if (protocol) {
				if (protocol.protocol) {
					setCouncilId(protocol.protocol[0]?.councilId);
				}
				if (protocol.sections) {
					const protocolItem = protocol.sections.map(section => section.items.filter(item => item._id === protocolsItemId)[0])[0];
					const itemDesc = $(protocolItem.name).text();
					const itemResponsiblePerson = constructPersonFIO(protocolItem.responsible[0]);
					setDescription(itemDesc);
					setItemResponsible(itemResponsiblePerson);
					setProtocol({ d: protocol.protocol[0]?.d, num: protocol.protocol[0]?.num,  itemNum: protocolItem.num, itemResponsible: itemResponsiblePerson})
				}
				if (protocol.protocol && council.d) {
					const protocolCouncilId = protocol.protocol[0]?.councilId;
					const councilData = council.councils.filter(i => i._id === protocolCouncilId);
					setCouncil({ d: councilData[0].d, desc: councilData[0].desc });
				}
			}
		}, [protocol, protocolsItemId, council]);
	}

	const insertOrUpdateWorkingGroupRequest = useMethod('insertOrUpdateWorkingGroupRequest');

	const handleChoose = useCallback((context) => {
		setContext(context);
	}, []);

	const close = useCallback(() => setContext(''), []);

	const hasUnsavedChanges = useMemo(() => (description !== '' && number !== '') && (previousDescription !== description || previousNumber !== number || new Date(previousDate).getTime() !== new Date(date).getTime()),
		[description, previousDescription, number, previousNumber, date, previousDate]);

	const resetData = () => {
		setDescription(previousDescription);
		setNumber(previousNumber);
		onChange();
	};

	const filterNumber = (value) => {
		if (checkNumberWithDot(value, number) !== null || value === '') {
			setNumber(value);
		}
	};

	const saveAction = useCallback(async (number, description, date, protocolsItemId, councilId, protocolId, protocolItemsId, mail, protocol, council) => {
		console.log(number);
		console.log(description);
		const requestData = createWorkingGroupRequestData({
			protocolId, number, desc: description, date, previousData: { previousNumber, previousDescription, _id },
			protocolsItemId, councilId, protocolItemsId, mail, protocol, council
		});
		console.log({ requestData });
		const validation = validateWorkingGroupRequestData(requestData);
		console.log({ validation });
		if (validation.length === 0) {
			const _id = await insertOrUpdateWorkingGroupRequest(requestData);
			return _id;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [_id, dispatchToastMessage, insertOrUpdateWorkingGroupRequest, previousNumber, previousDescription, previousRequest, t]);

	const handleSaveRequest = useCallback(async () => {
		const result = await saveAction(number, description, date, protocolsItemId, councilId, protocolId, protocolItemsId, mail, protocol, council);
		FlowRouter.go('working-groups-requests');
		if (result) {
			dispatchToastMessage({ type: 'success', message: t('Working_group_request_added') });
		} else {
			dispatchToastMessage({ type: 'success', message: t('Working_group_request_edited') });
		}
		if (onRequestChanged) {
			onRequestChanged({ number, date, desc: description });
			onChange();
		}
		// goToNew(result)();
	}, [saveAction, onChange, number, description, date, protocolsItemId, councilId, protocolId, protocolItemsId, mail, protocol, council]);

	console.log({ councilId, protocolId, protocolItemsId });
	return <Page flexDirection='row'>
		<Page>
			<Page.Header title=''>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Working_group_request')}</Label>
				</Field>
				<ButtonGroup mis='auto'>
					<Button primary small aria-label={t('Save')} onClick={handleSaveRequest}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContent padding='x24'>
				<Field mbe='x16' display='flex' flexDirection='row'>
					<Field mie='x4'>
						<Field.Label>{t('Number')}</Field.Label>
						<Field.Row>
							<TextInput value={number} onChange={(e) => setNumber(e.currentTarget.value)} placeholder={t('Number')} fontScale='p1'/>
						</Field.Row>
					</Field>
					<Field mis='x4'>
						<Field.Label>{t('Date')}</Field.Label>
						<Field.Row>
							<DatePicker
								dateFormat='dd.MM.yyyy HH:mm'
								selected={date}
								onChange={(newDate) => setDate(newDate)}
								showTimeSelect
								timeFormat='HH:mm'
								timeIntervals={5}
								timeCaption='Время'
								customInput={<TextInput />}
								locale='ru'
								popperClassName='date-picker'/>
						</Field.Row>
					</Field>
				</Field>
				{<Field mbe='x16' display='flex' flexDirection='row'>
					{<Field mie='x4'>
						<Field.Label>{t('Council')}</Field.Label>
						<Field.Row>
							<Button onClick={() => handleChoose('councilChoose')} fontScale='p1'>{[councilId ?? '', t('Choose')].join(' ')}</Button>
						</Field.Row>
					</Field>}
					{<Field mis='x4'>
						<Field.Label>{t('Protocol')}</Field.Label>
						<Field.Row>
							<Button onClick={() => handleChoose('protocolChoose')} fontScale='p1'>{[protocolId ?? '', t('Choose')].join(' ')}</Button>
						</Field.Row>
					</Field>}
				</Field>}
				<Field mbe='x16'>
					<Field.Label>{t('Protocol_Item')}</Field.Label>
					<Field.Row>
						<Button onClick={() => handleChoose('protocolItemChoose')} fontScale='p1'>{[t('Choose'), protocolId ?? ''].join(' ')}</Button>
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Errand_Charged_to')}</Field.Label>
					<Field.Row>
						<TextInput value={ itemResponsible } onChange={(e) => setItemResponsible(e.currentTarget.value)} placeholder={t('Errand_Charged_to')} fontScale='p1'/>
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Working_group_request_select_mail')}</Field.Label>
					<Field.Row>
						<TextInput value={mail} onChange={(event) => setMail(event.currentTarget.value)} fontScale='p1'/>
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows='3' value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} fontScale='p1'/>
					</Field.Row>
				</Field>
			</Page.ScrollableContent>
		</Page>
		{context
		&& <VerticalBar className='contextual-bar' style={{ flex: 'auto' }} width='x450' qa-context-name={`admin-user-and-room-context-${ context }`}>
			<VerticalBar.Header>
				{ context === 'councilChoose' && t('Council_Choose') }
				{ context === 'protocolChoose' && t('Protocol_Choose') }
				{ context === 'protocolItemChoose' && t('Protocol_Item_Choose') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				{context === 'councilChoose' && <CouncilChoose setCouncilId={setCouncilId} close={close}/>}
				{context === 'protocolChoose' && <ProtocolChoose setProtocolId={setProtocolId} close={close}/>}
				{context === 'protocolItemChoose' && <ItemsChoose protocolId={protocolId} setProtocolItemsId={setProtocolItemsId} close={close}/>}
			</VerticalBar.ScrollableContent>
		</VerticalBar>}
	</Page>;
}

NewAddRequest.displayName = 'NewAddRequest';

export default NewAddRequest;

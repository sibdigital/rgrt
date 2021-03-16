import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
	Button,
	ButtonGroup,
	Field,
	TextInput,
	TextAreaInput,
	Label,
	Table,
	Callout,
	Box,
	Flex, Skeleton, Tile, Scrollable,
} from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { createWorkingGroupRequestData, validateWorkingGroupRequestData } from './lib';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { checkNumberWithDot } from '../../../utils/client/methods/checkNumber';
import Page from '../../../../client/components/basic/Page';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { GenericTable, Th, LoadingRow } from '/client/components/GenericTable';
import flattenChildren from 'react-keyed-flatten-children';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { CouncilChoose } from './CouncilChoose';
import { ProtocolChoose } from './ProtocolChoose';
import { ItemsChoose } from './ItemsChoose';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

export function AddRequest({ editData, onChange, onRequestChanged = null, docsdata }) {
	const data = {
		_id: null,
		number: '',
		desc: '',
		date: new Date(),
		mails: [],
	};
	console.log(editData);

	// return <AddRequestWithData mode={'edit'} request={editData ?? data} docsdata={docsdata} onChange={onChange} onRequestChanged={onRequestChanged}/>;
	return <NewAddRequest mode={'edit'} request={editData ?? data} docsdata={docsdata} onChange={onChange} onRequestChanged={onRequestChanged}/>;
}

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

function AddRequestWithData({ mode, request, onChange, onRequestChanged, docsdata, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const routeName = 'working-groups-requests';

	const { _id, number: previousNumber, desc: previousDescription, date: previousDate } = request || {};
	const previousRequest = request || {};

	const [number, setNumber] = useState(previousNumber);
	const [description, setDescription] = useState(previousDescription);
	const [date, setDate] = useState(previousDate ? new Date(previousDate) : new Date());
	const [councilId, setCouncilId] = useState(null);

	const router = useRoute(routeName);

	const protocolsItemId = FlowRouter.getParam('id');
	const workingGroupRequestContext = FlowRouter.getParam('context');

	if (protocolsItemId && workingGroupRequestContext === 'new-protocols-item-request') {
		const currentRequestQuery = docsdata.filter(request => request.protocolsItemId === protocolsItemId)[0];

		if (currentRequestQuery) {
			FlowRouter.go(`/working-groups-request/${ currentRequestQuery._id }`);
		}

		const query = useMemo(() => ({
			query: JSON.stringify({ _id: protocolsItemId }),
		}), [protocolsItemId]);

		const { data: protocol } = useEndpointDataExperimental('protocols.findByItemId', query) || { sections: [] };

		useEffect(() => {
			console.log(protocol);
			if (protocol) {
				if (protocol.protocol) {
					console.log({ councilId: protocol.protocol[0]?.councilId });
					setCouncilId(protocol.protocol[0]?.councilId);
				}
				if (protocol.sections) {
					const protocolItem = protocol.sections.map(section => section.items.filter(item => item._id === protocolsItemId)[0])[0];
					setDescription(protocolItem.name.slice(3, -4));
				}
			}
		}, [protocol, protocolsItemId]);
	}

	const insertOrUpdateWorkingGroupRequest = useMethod('insertOrUpdateWorkingGroupRequest');

	const goToNew = useCallback((_id) => () => {
		//console.log(_id._id)
		router.push({});
	}, [router]);

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

	const saveAction = useCallback(async (number, description, date, protocolsItemId, councilId) => {
		console.log(number);
		console.log(description);
		const requestData = createWorkingGroupRequestData(number, description, date, { previousNumber, previousDescription, _id }, protocolsItemId, councilId);
		const validation = validateWorkingGroupRequestData(requestData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateWorkingGroupRequest(requestData);
			return _id;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [_id, dispatchToastMessage, insertOrUpdateWorkingGroupRequest, previousNumber, previousDescription, previousRequest, t]);

	const handleSaveRequest = useCallback(async () => {
		const result = await saveAction(number, description, date, protocolsItemId, councilId);
		if (!request._id) {
			dispatchToastMessage({ type: 'success', message: t('Working_group_request_added') });
		} else {
			dispatchToastMessage({ type: 'success', message: t('Working_group_request_edited') });
		}
		if (onRequestChanged) {
			onRequestChanged({ number, date, desc: description });
		}
		onChange();
		goToNew(result)();
	}, [saveAction, onChange, number, description, date, protocolsItemId, councilId]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Number')}</Field.Label>
			<Field.Row>
				<TextInput border='1px solid #4fb0fc' value={number} onChange={(e) => filterNumber(e.currentTarget.value)} placeholder={t('Number')}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Description')}</Field.Label>
			<Field.Row>
				<TextAreaInput style={ { whiteSpace: 'normal' } } row='10' border='1px solid #4fb0fc' value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} />
			</Field.Row>
		</Field>
		<Field>
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
					customInput={<TextInput border='1px solid #4fb0fc'/>}
					locale='ru'
					popperClassName='date-picker'/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button primary small aria-label={t('Cancel')} onClick={resetData}>
						{t('Cancel')}
					</Button>
					<Button primary small aria-label={t('Save')} disabled={!hasUnsavedChanges} onClick={handleSaveRequest}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
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
	const [context, setContext] = useState('');

	const protocolsItemId = FlowRouter.getParam('id');
	const workingGroupRequestContext = FlowRouter.getParam('context');

	if (protocolsItemId && workingGroupRequestContext === 'new-protocols-item-request') {
		const currentRequestQuery = docsdata.filter(request => request.protocolsItemId === protocolsItemId)[0];

		if (currentRequestQuery) {
			FlowRouter.go(`/working-groups-request/${ currentRequestQuery._id }`);
		}

		const query = useMemo(() => ({
			query: JSON.stringify({ _id: protocolsItemId }),
		}), [protocolsItemId]);

		const { data: protocol } = useEndpointDataExperimental('protocols.findByItemId', query) || { sections: [] };

		useEffect(() => {
			console.log(protocol);
			if (protocol) {
				if (protocol.protocol) {
					console.log({ councilId: protocol.protocol[0]?.councilId });
					setCouncilId(protocol.protocol[0]?.councilId);
				}
				if (protocol.sections) {
					const protocolItem = protocol.sections.map(section => section.items.filter(item => item._id === protocolsItemId)[0])[0];
					setDescription(protocolItem.name.slice(3, -4));
				}
			}
		}, [protocol, protocolsItemId]);
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

	const saveAction = useCallback(async (number, description, date, protocolsItemId, councilId, protocolId, protocolItemsId, mail) => {
		console.log(number);
		console.log(description);
		const requestData = createWorkingGroupRequestData({ protocolId, number, desc: description, date, previousData: { previousNumber, previousDescription, _id }, protocolsItemId, councilId, protocolItemsId, mail });
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
		const result = await saveAction(number, description, date, protocolsItemId, councilId, protocolId, protocolItemsId, mail);
		if (!request._id) {
			dispatchToastMessage({ type: 'success', message: t('Working_group_request_added') });
			FlowRouter.go('working-groups-requests');
		} else {
			dispatchToastMessage({ type: 'success', message: t('Working_group_request_edited') });
		}
		if (onRequestChanged) {
			onRequestChanged({ number, date, desc: description });
			onChange();
		}
		// goToNew(result)();
	}, [saveAction, onChange, number, description, date, protocolsItemId, councilId, protocolId, protocolItemsId, mail]);

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
			<Page.ScrollableContent>
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

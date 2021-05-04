import React, { useCallback, useMemo } from 'react';
import { Box, Button, Chip, Field, Margins, Select, Table, TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import DatePicker from 'react-datepicker';
import _ from 'underscore';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../client/hooks/useForm';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { checkNumber } from '../../../utils/client/methods/checkNumber';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { getAnimation } from '../../../utils';
import { ClearButton } from '../../../utils/client/views/ClearButton';
import { constructPersonFullFIO } from '../../../utils/client/methods/constructPersonFIO';
import { settings } from '../../../settings/client';
import { ResponsibleChoose } from './ResponsibleChoose';
import { CouncilChoose } from './CouncilChoose';
import { ProtocolChoose } from './ProtocolChoose';
import { ItemsChoose } from './ItemsChoose';

require('react-datepicker/dist/react-datepicker.css');

export const defaultRequestTypeState = Object.freeze({
	REQUEST: { state: 1, title: 'Working_group_request_for_protocol_item', i18nLabel: 'Запрос по пункту протокола' },
	MAIL: { state: 2, title: 'Working_group_request_for_mail', i18nLabel: 'Запрос по письму' },
});

export const getRequestTypeByState = ({ state = 1 }) => {
	if (!state) { return defaultRequestTypeState.REQUEST; }

	for (const [key, value] of Object.entries(defaultRequestTypeState)) {
		if (value.state === state) {
			return value;
		}
	}

	return defaultRequestTypeState.REQUEST;
};

export const defaultRequestFields = {
	number: '',
	date: new Date(),
	council: '',
	protocol: '',
	protocolItems: [],
	itemResponsible: '',
	mail: '',
	description: '',
	requestType: defaultRequestTypeState.REQUEST,
};

export function getRequestFormFields({ request = null, onGetAllFieldsFromPrevAnswer = false }) {
	if (!request || typeof request !== 'object' || _.isArray(request)) {
		return defaultRequestFields;
	}

	const requestValues = { ...request };

	const defaultRequestFieldsKeys = Object.keys(defaultRequestFields);

	const requestKeys = Object.keys(request);

	defaultRequestFieldsKeys.forEach((key) => {
		if (!requestKeys.includes(key)) {
			requestValues[key] = defaultRequestFields[key];
		}
	});
	requestValues.date = requestValues.date ? new Date(requestValues.date) : new Date();

	console.dir({ requestValues });
	return requestValues;
}

export function useDefaultRequestForm({ defaultValues = null }) {
	const {
		values,
		handlers,
		reset,
		commit,
		hasUnsavedChanges,
	} = useForm(defaultValues ?? defaultRequestFields);

	const allFieldAreFilled = useMemo(() => Object.entries(values).filter((val) => {
		const [key, value] = val;
		if (key === 'mail' || key === 'protocol' || key === 'council' || key === 'protocolItems') { return false; }
		if (typeof value === 'string' && value.trim() !== '') { return false; }
		if (typeof value === 'object' && value.length > 0) { return false; }
		return value.toString().trim() === '';
	}).length === 0, [values]);

	return {
		values,
		handlers,
		reset,
		commit,
		hasUnsavedChanges,
		allFieldAreFilled,
	};
}

function CouncilField({ council, handleCouncil, chooseButtonStyles, handleChoose, flexDirection = 'column', ...props }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const label = useMemo(() => (!council.d ? '' : [t('Council'), t('Date_to'), formatDateAndTime(council.d)].join(' ')), [council, formatDateAndTime, t]);
	const address = useMemo(() => [settings.get('Site_Url'), 'council/', council?._id ?? ''].join(''), [council]);

	return useMemo(() =>
		<Field mie='x4' mbs='x4' mbe='x16' display='flex' flexDirection={flexDirection}>
			<Field.Label alignSelf='center' mie='x16' display='flex' flexDirection='row' alignItems='center'>
				{t('Council')} {council && council._id && <ClearButton onClick={() => handleCouncil({})}/>}
			</Field.Label>
			<Box border='1px solid #4fb0fc' display='flex' flexDirection='row' width='inherit'>
				{label === ''
					? <TextInput value={label} borderWidth='0' readOnly placeholder={t('Council')}/>
					: <Box display='flex' alignItems='center' borderWidth='0' padding='x8'><a href={address} target='_blank'>{label}</a></Box>
				}
				<Button mis='auto' mie='x8' alignSelf='center' style={chooseButtonStyles} small onClick={() => handleChoose('councilChoose')} fontScale='p1'>{t('Choose')}</Button>
			</Box>
		</Field>
	, [chooseButtonStyles, flexDirection, handleChoose, handleCouncil, label, t]);
}

export function ProtocolField({ protocol, handleProtocol, handleProtocolItems, chooseButtonStyles, handleChoose, flexDirection = 'column', ...props }) {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const label = useMemo(() => (!protocol.d && !protocol.num ? '' : [t('Protocol'), ' ', t('Date_to'), ' ', formatDate(protocol.d), ' №', protocol.num].join('')), [protocol, formatDate, t]);
	const address = useMemo(() => [settings.get('Site_Url'), 'protocol/', protocol?._id ?? ''].join(''), [protocol]);

	return useMemo(() =>
		<Field mis='x4' mbs='x4' mbe='x16' display='flex' flexDirection={flexDirection}>
			<Field.Label alignSelf='center' mie='x16' display='flex' flexDirection='row' alignItems='center'>
				{t('Protocol')} {protocol && protocol._id && <ClearButton onClick={() => { handleProtocolItems([]); handleProtocol({ }); }}/>}
			</Field.Label>
			<Box border='1px solid #4fb0fc' display='flex' flexDirection='row' width='inherit'>
				{label === ''
					? <TextInput value={label} borderWidth='0' readOnly placeholder={t('Protocol')}/>
					: <Box display='flex' alignItems='center' borderWidth='0' padding='x8'><a href={address} target='_blank'>{label}</a></Box>
				}
				<Button mis='auto' mie='x8' alignSelf='center' style={chooseButtonStyles} small onClick={() => handleChoose('protocolChoose')} fontScale='p1'>{t('Choose')}</Button>
			</Box>
		</Field>
	, [flexDirection, t, protocol, label, chooseButtonStyles, handleProtocolItems, handleProtocol, handleChoose]);
}

export function ProtocolItemsField({
	protocolId,
	protocolItems,
	handleProtocolItems,
	chooseButtonStyles,
	onShowLabelAndTooltip = true,
	onShowChooseButton = true,
	handleChoose = () => {},
}) {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const handleProtocolItemChipClick = useCallback((index) => {
		const arr = protocolItems.filter((chip, _index) => _index !== index);
		handleProtocolItems(arr);
	}, [handleProtocolItems, protocolItems]);

	return useMemo(() =>
		<Box display='flex' flexDirection='row' justifyContent='flex-start' mbs='x4' borderColor='var(--rc-color-primary-button-color)'>
			{onShowLabelAndTooltip
			&& <Field.Label style={{ flex: '0 0 0px', whiteSpace: 'pre' }} alignSelf='center' display='flex' flexDirection='row' alignItems='center'>
				{t('Protocol_Item')} {protocolItems && protocolItems.length > 0 && <ClearButton onClick={() => handleProtocolItems([])}/>}
			</Field.Label>
			}
			<Margins all='x4'>
				<Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start' mbs='x4' borderColor='var(--rc-color-primary-button-color)'>
					{ protocolItems.map((item, index) =>
						<Chip mie='x8' mbe='x8' pi='x4' key={index} style={{ whiteSpace: 'normal', borderRadius: '0.6rem' }}
							onClick={() => handleProtocolItemChipClick(index)} border='1px solid' color='var(--rc-color-button-primary-light)'>
							{(!item.num ? '' : [t('Protocol_Item'), ' №', item.num].join(''))}
						</Chip>)}
				</Box>
				{onShowChooseButton && <Field
					maxHeight='30px' maxWidth='250px' display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start'
					border='0px hidden transparent' borderRadius='0.6rem' alignItems='center'>
					<Button disabled={!protocolId} style={chooseButtonStyles} small onClick={() => handleChoose('protocolItemChoose')} fontScale='p1'>{t('Choose')}</Button>
				</Field>}
			</Margins>
		</Box>
	, [t, protocolItems, protocolId, chooseButtonStyles, handleProtocolItems, formatDate, handleProtocolItemChipClick, handleChoose]);
}

export function MailField({ requestType, mail, inputStyles, handleMail }) {
	const t = useTranslation();

	return useMemo(() =>
		(requestType.state === defaultRequestTypeState.MAIL.state || requestType.state === defaultRequestTypeState.MAIL.state)
			&& <Field mbe='x16' display='flex' flexDirection='row'>
				<Field.Label alignSelf='center' mie='x16' style={{ whiteSpace: 'pre' }}>{t('Working_group_request_select_mail')}</Field.Label>
				<Field.Row width='inherit'>
					<TextInput style={ inputStyles } placeholder={t('Working_group_request_select_mail')} value={mail} onChange={(event) => handleMail(event)} fontScale='p1'/>
				</Field.Row>
			</Field>
	, [handleMail, inputStyles, mail, requestType, t]);
}

export function ResponsibleField({
	chooseButtonStyles,
	handleChoose,
	handleItemResponsible,
	flexDirection = 'column',
	itemResponsible,
	isCanChangeResponsible = false,
	...props
}) {
	const t = useTranslation();
	const label = useMemo(() => constructPersonFullFIO(itemResponsible ?? ''), [itemResponsible]);
	const _chooseButtonStyles = useMemo(() => chooseButtonStyles ?? { backgroundColor: 'transparent', borderColor: 'var(--rc-color-primary-button-color)', borderRadius: '0.7rem', borderWidth: '1.5px' }, [chooseButtonStyles]);

	return useMemo(() =>
		<Field mie='x4' mbs='x4' mbe='x16' display='flex' flexDirection={flexDirection}>
			<Field.Label alignSelf={flexDirection === 'column' ? 'auto' : 'center'} mie='x16' display='flex' flexDirection='row' alignItems='center'>
				{t('Errand_Charged_to')} {itemResponsible && itemResponsible._id && isCanChangeResponsible && <ClearButton onClick={() => handleItemResponsible({})}/>}
			</Field.Label>
			<Box border='1px solid #4fb0fc' display='flex' flexDirection='row' width='inherit'>
				<TextInput value={label} borderWidth='0' readOnly placeholder={t('Errand_Charged_to')}/>
				{isCanChangeResponsible && <Button mis='auto' mie='x8' alignSelf='center' style={_chooseButtonStyles} small onClick={() => handleChoose('responsibleChoose')} fontScale='p1'>
					{t('Choose')}
				</Button>}
			</Box>
		</Field>
	, [_chooseButtonStyles, flexDirection, handleChoose, handleItemResponsible, itemResponsible, label, t]);
}

const SlideAnimation = getAnimation({ type: 'slideInDown' });

function RequestForm({ defaultValues = null, defaultHandlers = null, setContext = null, isCanSaveRequest = false }) {
	const t = useTranslation();

	const {
		values,
		handlers,
	} = useDefaultRequestForm({ defaultValues });

	const {
		number,
		date,
		council,
		protocol,
		protocolItems,
		itemResponsible,
		mail,
		description,
		requestType,
	} = defaultValues ?? values;

	const {
		handleNumber,
		handleDate,
		handleItemResponsible,
		handleMail,
		handleDescription,
		handleProtocolItems,
		handleCouncil,
		handleProtocol,
		handleRequestType,
	} = defaultHandlers ?? handlers;

	const inputStyles = useMemo(() => ({ wordBreak: 'break-word', whiteSpace: 'normal', border: '1px solid #4fb0fc' }), []);
	const chooseButtonStyles = useMemo(() => ({ backgroundColor: 'transparent', borderColor: 'var(--rc-color-primary-button-color)', borderRadius: '0.7rem', borderWidth: '1.5px' }), []);

	const requestTypeOption = useMemo(() => {
		const options = [];
		for (const [key, value] of Object.entries(defaultRequestTypeState)) {
			console.dir({ key, value });
			options.push([value.state, value.i18nLabel]);
		}
		return options;
	}, []);

	const handleChoose = useCallback((context) => {
		setContext && setContext(context);
	}, [setContext]);

	const onChangeField = useCallback((val, handler) => {
		handler(val);
	}, []);

	const filterNumber = (value) => {
		if (checkNumber(value) !== null) {
			handleNumber(value);
		}
	};
	// console.dir({ defaultValues });

	return <Box display='flex' flexDirection='column'>

		<Select
			border={inputStyles.border}
			// style={{ marginInlineStart: 'auto !important', marginBlockEnd: '1rem !important' }}
			mie='auto'
			mbe='x16'
			width='max-content'
			maxHeight='40px'
			options={requestTypeOption}
			value={requestType?.state ?? requestType}
			onChange={(val) => handleRequestType(getRequestTypeByState({ state: val }))}
		/>

		<Margins all='x4'>

			<Field mbs='x4' mbe='x16' display='flex' flexDirection='row'>
				<Field display='flex' flexDirection='row'>
					<Field.Label maxWidth='100px' alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Number')}</Field.Label>
					<TextInput mie='x12' value={number} style={ inputStyles } placeholder={t('Number')} onChange={(e) => filterNumber(e.currentTarget.value)} fontScale='p1'/>
				</Field>
				<Field mis='x4' display='flex' flexDirection='row'>
					<Field.Label alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Date')}</Field.Label>
					<DatePicker
						mie='x16'
						dateFormat='dd.MM.yyyy'
						selected={date}
						onChange={(newDate) => onChangeField(newDate, handleDate)}
						// showTimeSelect
						// timeFormat='HH:mm'
						// timeIntervals={5}
						// timeCaption='Время'
						customInput={<TextInput style={ inputStyles } />}
						locale='ru'
						popperClassName='date-picker'/>
				</Field>
			</Field>
			<Field mbe='x16' display='flex' flexDirection='row'>
				{useMemo(() => requestType.state === defaultRequestTypeState.REQUEST.state
					&& <CouncilField flexDirection={'row'} chooseButtonStyles={chooseButtonStyles} council={council} handleCouncil={handleCouncil} handleChoose={handleChoose}/>
				, [chooseButtonStyles, council, handleChoose, handleCouncil, requestType])}
				{useMemo(() => requestType.state === defaultRequestTypeState.REQUEST.state
					&& <ProtocolField flexDirection={'row'} chooseButtonStyles={chooseButtonStyles} protocol={protocol} handleProtocol={handleProtocol} handleProtocolItems={handleProtocolItems} handleChoose={handleChoose}/>
				, [requestType, chooseButtonStyles, protocol, handleProtocol, handleProtocolItems, handleChoose])}
			</Field>
			<Field mbe='x16' display='flex' flexDirection='row'>
				{
					useMemo(() =>
						requestType.state === defaultRequestTypeState.REQUEST.state && protocol._id && protocol._id !== ''
						&& <SlideAnimation>
							<ProtocolItemsField
								protocolId={protocol?._id ?? null}
								handleChoose={handleChoose}
								chooseButtonStyles={chooseButtonStyles}
								protocolItems={protocolItems}
								handleProtocolItems={handleProtocolItems}
								handleItemResponsible={handleItemResponsible}
							/>
						</SlideAnimation>
					, [requestType, protocol, handleChoose, chooseButtonStyles, protocolItems, handleProtocolItems, handleItemResponsible])
				}
			</Field>

			{useMemo(() => (requestType.state === defaultRequestTypeState.MAIL.state || requestType.state === defaultRequestTypeState.MAIL.state)
				&& <Field mbe='x16' display='flex' flexDirection='row'>
					<Field.Label alignSelf='center' mie='x16' style={{ whiteSpace: 'pre' }}>{t('Working_group_request_select_mail')}</Field.Label>
					<Field.Row width='inherit'>
						<TextInput style={ inputStyles } placeholder={t('Working_group_request_select_mail')} value={mail} onChange={(event) => onChangeField(event, handleMail)} fontScale='p1'/>
					</Field.Row>
				</Field>, [handleMail, inputStyles, mail, onChangeField, requestType, t])
			}

			<Field mbe='x16'>
				<ResponsibleField isCanChangeResponsible={isCanSaveRequest} flexDirection={'row'} handleItemResponsible={handleItemResponsible} itemResponsible={itemResponsible} chooseButtonStyles={chooseButtonStyles} handleChoose={handleChoose}/>
			</Field>

			<Field mbe='x16'>
				<Field.Label>{t('Description')}</Field.Label>
				<Field.Row>
					<TextAreaInput style={ inputStyles } rows='5' value={description} onChange={(event) => onChangeField(event, handleDescription)} placeholder={t('Description')} fontScale='p1'/>
				</Field.Row>
			</Field>

		</Margins>
	</Box>;
}

export default RequestForm;

export function WorkingGroupRequestVerticalChooseBar({ handlers, context, protocolId, close, protocolItems = [] }) {
	const t = useTranslation();

	const verticalBarFieldChange = useCallback((field) => (value) => {
		if (handlers && handlers[field]) {
			handlers[field](value);
		}
	}, [handlers]);
	const prevId = useMemo(() => [], []);

	return context
		&& <VerticalBar className='contextual-bar' style={{ flex: 'auto' }} width='x450' qa-context-name={`admin-user-and-room-context-${ context }`}>
			<VerticalBar.Header>
				{ context === 'councilChoose' && t('Council_Choose') }
				{ context === 'protocolChoose' && t('Protocol_Choose') }
				{ context === 'protocolItemChoose' && t('Protocol_Item_Choose') }
				{ context === 'responsibleChoose' && t('Responsible_Choose')}
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				{context === 'councilChoose' && <CouncilChoose
					setProtocol={verticalBarFieldChange('handleProtocol')}
					setCouncil={verticalBarFieldChange('handleCouncil')}
					close={close}/>}
				{context === 'protocolChoose' && <ProtocolChoose
					setProtocol={verticalBarFieldChange('handleProtocol')}
					setCouncil={verticalBarFieldChange('handleCouncil')}
					close={close}/>}
				{context === 'protocolItemChoose' && <ItemsChoose
					protocolId={protocolId}
					protocolItems={protocolItems}
					setProtocolItems={verticalBarFieldChange('handleProtocolItems')}
					close={close}/>}
				{context === 'responsibleChoose' && <ResponsibleChoose
					onSetResponsible={verticalBarFieldChange('handleItemResponsible')}
					prevResponsiblesId={prevId}
					close={close}/>}
			</VerticalBar.ScrollableContent>
		</VerticalBar>;
}

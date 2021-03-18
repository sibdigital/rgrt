import React, { useCallback, useMemo } from 'react';
import { Box, Button, Chip, Field, Margins, TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import DatePicker from 'react-datepicker';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../client/hooks/useForm';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { checkNumber } from '../../../utils/client/methods/checkNumber';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { CouncilChoose } from './CouncilChoose';
import { ProtocolChoose } from './ProtocolChoose';
import { ItemsChoose } from './ItemsChoose';

export function useDefaultRequestForm({ defaultValues = null }) {
	const defaultFields = {
		number: '',
		date: new Date(),
		council: '',
		protocol: '',
		protocolItems: [],
		itemResponsible: '',
		mail: '',
		description: '',
	};

	const {
		values,
		handlers,
		reset,
		commit,
		hasUnsavedChanges,
	} = useForm(defaultValues ?? defaultFields);

	const allFieldAreFilled = useMemo(() => Object.values(values).filter((val) => {
		if (typeof val === 'string' && val.trim() !== '') { return false; }
		if (typeof val === 'object' && val.length > 0) { return false; }
		return val.toString().trim() === '';
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

function CouncilField({ council, chooseButtonStyles, handleChoose, flexDirection = 'column', ...props }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const label = useMemo(() => (!council.d ? '' : [t('Council'), t('Date_to'), formatDateAndTime(council.d)].join(' ')), [council, formatDateAndTime, t]);
	console.log('council field');

	return useMemo(() =>
		<Field mie='x4' mbs='x4' mbe='x16' display='flex' flexDirection={flexDirection}>
			<Field.Label>{t('Council')}</Field.Label>
			<Box border='1px solid #4fb0fc' display='flex' flexDirection='row'>
				<TextInput value={label} borderWidth='0' readOnly placeholder={t('Council')}/>
				<Button mis='auto' mie='x8' alignSelf='center' style={chooseButtonStyles} small onClick={() => handleChoose('councilChoose')} fontScale='p1'>{t('Choose')}</Button>
			</Box>
		</Field>
	, [chooseButtonStyles, flexDirection, handleChoose, label, t]);
}

function ProtocolField({ protocol, chooseButtonStyles, handleChoose, flexDirection = 'column', ...props }) {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const label = useMemo(() => (!protocol.d && !protocol.num ? '' : [t('Protocol'), ' ', t('Date_to'), ' ', formatDate(protocol.d), ' №', protocol.num].join('')), [protocol, formatDate, t]);
	console.log('ProtocolField field');

	return useMemo(() =>
		<Field mis='x4' mbs='x4' mbe='x16' display='flex' flexDirection={flexDirection}>
			<Field.Label>{t('Protocol')}</Field.Label>
			<Box border='1px solid #4fb0fc' display='flex' flexDirection='row'>
				<TextInput value={label} borderWidth='0' readOnly placeholder={t('Protocol')}/>
				<Button mis='auto' mie='x8' alignSelf='center' style={chooseButtonStyles} small onClick={() => handleChoose('protocolChoose')} fontScale='p1'>{t('Choose')}</Button>
			</Box>
		</Field>
	, [t, label, chooseButtonStyles, handleChoose, flexDirection]);
}

function ProtocolItemsField({ protocolId, protocolItems, handleProtocolItems, chooseButtonStyles, handleChoose }) {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const handleProtocolItemChipClick = useCallback((index) => {
		console.log('handleProtocolItemChipClick');
		const arr = protocolItems.filter((chip, _index) => _index !== index);
		handleProtocolItems(arr);
	}, [handleProtocolItems, protocolItems]);

	return useMemo(() =>
		<Box display='flex' flexDirection='column' flexWrap='wrap' justifyContent='flex-start' mbs='x4' borderColor='var(--rc-color-primary-button-color)'>
			<Field.Label>{t('Protocol_Item')}</Field.Label>
			<Margins all='x4'>
				<Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start' mbs='x4' borderColor='var(--rc-color-primary-button-color)'>
					{ protocolItems.map((item, index) =>
						<Chip pi='x4' key={index} style={{ whiteSpace: 'normal', borderRadius: '0.6rem' }}
							onClick={() => handleProtocolItemChipClick(index)} border='1px solid' color='var(--rc-color-button-primary-light)'>
							{(!item.d && !item.num ? '' : [t('Protocol'), ' ', t('Date_to'), ' ', formatDate(item.d), ' №', item.num].join(''))}
						</Chip>)}
				</Box>
				<Field
					maxHeight='30px' maxWidth='250px' display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start'
					border='0px hidden transparent' borderRadius='0.6rem' alignItems='center'>
					<Button disabled={!protocolId} style={chooseButtonStyles} small onClick={() => handleChoose('protocolItemChoose')} fontScale='p1'>{t('Add')}</Button>
				</Field>
			</Margins>
		</Box>
	, [chooseButtonStyles, formatDate, handleChoose, handleProtocolItemChipClick, protocolItems, t, protocolId]);
}

function RequestForm({ defaultValues = null, defaultHandlers = null, setContext = null }) {
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
	} = defaultValues ?? values;

	const {
		handleNumber,
		handleDate,
		handleItemResponsible,
		handleMail,
		handleDescription,
		handleProtocolItems,
	} = defaultHandlers ?? handlers;

	const inputStyles = useMemo(() => ({ wordBreak: 'break-word', whiteSpace: 'normal', border: '1px solid #4fb0fc' }), []);
	const chooseButtonStyles = useMemo(() => ({ backgroundColor: 'transparent', borderColor: 'var(--rc-color-primary-button-color)', borderRadius: '0.7rem', borderWidth: '1.5px' }), []);

	const handleChoose = useCallback((context) => {
		setContext && setContext(context);
	}, [setContext]);

	const onChangeField = useCallback((val, handler) => {
		handler(val);
	}, []);

	const filterNumber = (value) => {
		if (checkNumber(value) !== null) {
			// setNumber(value);
		}
	};

	return <Box display='flex' flexDirection='column'>
		<Margins all='x4'>

			<Field mbs='x4' mbe='x16' display='flex' flexDirection='row'>
				<Field display='flex' flexDirection='row'>
					<Field.Label maxWidth='100px' alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Number')}</Field.Label>
					<TextInput mie='x12' value={number} style={ inputStyles } placeholder={t('Number')} onChange={(e) => onChangeField(e, handleNumber)} fontScale='p1'/>
				</Field>
				<Field mis='x4' display='flex' flexDirection='row'>
					<Field.Label alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Date')}</Field.Label>
					<DatePicker
						mie='x16'
						dateFormat='dd.MM.yyyy HH:mm'
						selected={date}
						onChange={(newDate) => onChangeField(newDate, handleDate)}
						showTimeSelect
						timeFormat='HH:mm'
						timeIntervals={5}
						timeCaption='Время'
						customInput={<TextInput style={ inputStyles } />}
						locale='ru'
						popperClassName='date-picker'/>
				</Field>
			</Field>
			<Field mbe='x16' display='flex' flexDirection='row'>
				<CouncilField chooseButtonStyles={chooseButtonStyles} council={council} handleChoose={handleChoose}/>
				<ProtocolField chooseButtonStyles={chooseButtonStyles} protocol={protocol} handleChoose={handleChoose}/>
			</Field>
			<Field mbe='x16' display='flex' flexDirection='row'>
				{
					useMemo(() =>
						<ProtocolItemsField protocolId={protocol?._id ?? null} handleChoose={handleChoose} chooseButtonStyles={chooseButtonStyles} protocolItems={protocolItems} handleProtocolItems={handleProtocolItems}/>
					, [chooseButtonStyles, handleChoose, handleProtocolItems, protocolItems, protocol])
				}
			</Field>
			<Field mbe='x16'>
				<Field.Label>{t('Errand_Charged_to')}</Field.Label>
				<Field.Row>
					<TextInput style={ inputStyles } value={ itemResponsible } onChange={(event) => onChangeField(event, handleItemResponsible)} placeholder={t('Errand_Charged_to')} fontScale='p1'/>
				</Field.Row>
			</Field>
			<Field mbe='x16'>
				<Field.Label>{t('Working_group_request_select_mail')}</Field.Label>
				<Field.Row>
					<TextInput style={ inputStyles } placeholder={t('Working_group_request_select_mail')} value={mail} onChange={(event) => onChangeField(event, handleMail)} fontScale='p1'/>
				</Field.Row>
			</Field>
			<Field mbe='x16'>
				<Field.Label>{t('Description')}</Field.Label>
				<Field.Row>
					<TextAreaInput style={ inputStyles } rows='3' value={description} onChange={(event) => onChangeField(event, handleDescription)} placeholder={t('Description')} fontScale='p1'/>
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

	return context
		&& <VerticalBar className='contextual-bar' style={{ flex: 'auto' }} width='x450' qa-context-name={`admin-user-and-room-context-${ context }`}>
			<VerticalBar.Header>
				{ context === 'councilChoose' && t('Council_Choose') }
				{ context === 'protocolChoose' && t('Protocol_Choose') }
				{ context === 'protocolItemChoose' && t('Protocol_Item_Choose') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				{context === 'councilChoose' && <CouncilChoose setCouncil={verticalBarFieldChange('handleCouncil')} close={close}/>}
				{context === 'protocolChoose' && <ProtocolChoose setProtocol={verticalBarFieldChange('handleProtocol')} close={close}/>}
				{context === 'protocolItemChoose' && <ItemsChoose protocolId={protocolId} protocolItems={protocolItems} setProtocolItems={verticalBarFieldChange('handleProtocolItems')} close={close}/>}
			</VerticalBar.ScrollableContent>
		</VerticalBar>;
}
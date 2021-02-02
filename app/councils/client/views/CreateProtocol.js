import React, { useState, useCallback, useMemo } from 'react';
import { Field, TextAreaInput, Button, InputBox, ButtonGroup, TextInput } from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { checkNumberWithDot } from '../../../utils/client/methods/checkNumber';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { validateProtocolData, createProtocolData } from './lib';

registerLocale('ru', ru);

export function CreateProtocol({ council, close, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { _id: councilId, d: councilDate } = council || {};
	const [date, setDate] = useState(new Date(councilDate));
	const [number, setNumber] = useState('');
	const [place, setPlace] = useState('');

	const participants = useMemo(() => council.invitedPersons?.map((e) => e._id), [council.invitedPersons]);

	const insertOrUpdateProtocol = useMethod('insertOrUpdateProtocol');

	const filterNumber = (value) => {
		if (checkNumberWithDot(value, number) !== null || value === '') {
			setNumber(value);
		}
	};

	const saveAction = useCallback(async (date, number, place, participants, councilId) => {
		const protocolData = createProtocolData(date, number, place, participants, councilId);
		const validation = validateProtocolData(protocolData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateProtocol(protocolData);
			return _id;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateProtocol, t]);

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(
				date,
				number,
				place,
				participants,
				councilId,
			);
			dispatchToastMessage({ type: 'success', message: t('Protocol_Added_Successfully') });
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, date, number, place, participants, councilId, saveAction, t]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Protocol_Number')}</Field.Label>
			<Field.Row>
				<InputBox value={number} onChange={(e) => filterNumber(e.currentTarget.value)} placeholder={t('Protocol_Number')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Protocol_Date')}</Field.Label>
			<Field.Row>
				<DatePicker
					dateFormat='dd.MM.yyyy'
					selected={date}
					disabled={true}
					onChange={(newDate) => setDate(newDate)}
					customInput={<TextInput />}
					locale='ru'
				/>
				{/* <InputBox type='date' value={date} onChange={(e) => setDate(e.currentTarget.value)} placeholder={t('Date')} />*/}
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Protocol_Place')}</Field.Label>
			<Field.Row>
				<TextAreaInput value={place} onChange={(e) => setPlace(e.currentTarget.value)} placeholder={t('Protocol_Place')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={date === '' || number === '' || place === ''}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}

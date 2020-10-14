import React, { useState, useCallback } from 'react';
import { Field, TextAreaInput, Button, InputBox, ButtonGroup, TextInput, ComboBox } from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
registerLocale('ru', ru);

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { validate, createWorkingGroupData } from './lib';
import VerticalBar from '../../../../client/components/basic/VerticalBar';

require('react-datepicker/dist/react-datepicker.css');

export function AddWorkingGroup({ goToNew, close, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [workingGroupType, setWorkingGroupType] = useState('');
	const [surname, setSurname] = useState('');
	const [name, setName] = useState('');
	const [patronymic, setPatronymic] = useState('');
	const [position, setPosition] = useState('');
	const [phone, setPhone] = useState('');
	const [email, setEmail] = useState('');

	const insertOrUpdateWorkingGroup = useMethod('insertOrUpdateWorkingGroup');

	const saveAction = async (workingGroupType, surname, name, patronymic, position, phone, email) => {
		const workingGroupData = createWorkingGroupData(workingGroupType, surname, name, patronymic, position, phone, email);
		const validation = validate(workingGroupData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateWorkingGroup(workingGroupData);
			return _id;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	};

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(
				workingGroupType,
				surname,
				name,
				patronymic,
				position,
				phone,
				email
			);
			dispatchToastMessage({ type: 'success', message: t('Working_Group_User_Added_Successfully') });
			goToNew(result)();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [workingGroupType, surname, name, patronymic, position, phone, email]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Working_group')}</Field.Label>
			<Field.Row>
				<TextAreaInput value={workingGroupType} onChange={(e) => setWorkingGroupType(e.currentTarget.value)} placeholder={t('Working_group')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Surname')}</Field.Label>
			<Field.Row>
				<TextInput value={surname} onChange={(e) => setSurname(e.currentTarget.value)} placeholder={t('Surname')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Name')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Patronymic')}</Field.Label>
			<Field.Row>
				<TextInput value={patronymic} onChange={(e) => setPatronymic(e.currentTarget.value)} placeholder={t('Patronymic')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Council_Organization_Position')}</Field.Label>
			<Field.Row>
				<TextAreaInput value={position} onChange={(e) => setPosition(e.currentTarget.value)} placeholder={t('Council_Organization_Position')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Phone_number')}</Field.Label>
			<Field.Row>
				<TextInput value={phone} onChange={(e) => setPhone(e.currentTarget.value)} placeholder={t('Phone_number')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Email')}</Field.Label>
			<Field.Row>
				<TextInput value={email} onChange={(e) => setEmail(e.currentTarget.value)} placeholder={t('Email')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}

import React, { useMemo } from 'react';
import {
	Field,
	TextInput,
	Icon,
	Scrollable,
	Select,
} from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { isEmail } from '../../../../utils/lib/isEmail.js';

export default function ParticipantForm({ formValues, formHandlers, availableRoles, workingGroupOptions, ...props }) {
	const t = useTranslation();

	const {
		surname,
		name,
		patronymic,
		phone,
		email,
		group,
		organization,
		position,
	} = formValues;

	const {
		handleSurname,
		handleName,
		handlePatronymic,
		handlePhone,
		handleEmail,
		handleGroup,
		handleOrganization,
		handlePosition,
	} = formHandlers;

	return <Scrollable { ...props }>
		<Field mb='x16'>
			{useMemo(() => <Field.Row mb='x4' width='98%'>
				<Field mb='x8' width='33%'>
					<Field.Label>{t('Surname')} <span style={{ color: 'red' }}>*</span></Field.Label>
					<TextInput mis='x8' flexGrow={1} value={surname} onChange={handleSurname}/>
				</Field>
				<Field mb='x8' width='33%'>
					<Field.Label>{t('Name')} <span style={{ color: 'red' }}>*</span></Field.Label>
					<TextInput mis='x8' flexGrow={1} value={name} onChange={handleName}/>
				</Field>
				<Field mb='x8' width='33%'>
					<Field.Label>{t('Patronymic')} <span style={{ color: 'red' }}>*</span></Field.Label>
					<TextInput mis='x8' flexGrow={1} value={patronymic} onChange={handlePatronymic}/>
				</Field>
			</Field.Row>, [t, surname, handleSurname, name, handleName, patronymic, handlePatronymic])}
			{useMemo(() => <Field.Row mb='x4' width='98%'>
				<Field mb='x8' width='49%'>
					<Field.Label>{t('Phone_number')} <span style={{ color: 'red' }}>*</span></Field.Label>
					<TextInput mis='x8' flexGrow={1} value={phone} onChange={handlePhone}/>
				</Field>
				<Field mb='x8' width='49%'>
					<Field.Label>{t('Email')} <span style={{ color: 'red' }}>*</span></Field.Label>
					<TextInput mis='x8' flexGrow={1} value={email} error={!isEmail(email) && email.length > 0 ? 'error' : undefined} onChange={handleEmail} addon={<Icon name='mail' size='x20'/>}/>
				</Field>
			</Field.Row>, [t, phone, handlePhone, email, handleEmail])}
			{useMemo(() => <Field.Row mb='x4' width='98%'>
				<Field mb='x8' width='49%'>
					<Field.Label>{t('Organization')} <span style={{ color: 'red' }}>*</span></Field.Label>
					<TextInput mis='x8' flexGrow={1} value={organization} onChange={handleOrganization}/>
				</Field>
				<Field mb='x8' width='49%'>
					<Field.Label>{t('Position')} <span style={{ color: 'red' }}>*</span></Field.Label>
					<TextInput mis='x8' flexGrow={1} value={position} onChange={handlePosition}/>
				</Field>
			</Field.Row>, [t, organization, handleOrganization, position, handlePosition])}
			{useMemo(() => <Field.Row mb='x4' width='98%'>
				<Field mb='x8'>
					<Field.Label>{t('Group')} <span style={{ color: 'red' }}>*</span></Field.Label>
					<Select mis='x8' flexGrow={1} onChange={handleGroup} value={group} options={workingGroupOptions} />
				</Field>
			</Field.Row>, [t, group, handleGroup, workingGroupOptions])}
		</Field>
	</Scrollable>;
}

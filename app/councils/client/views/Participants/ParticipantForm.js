import React, { useCallback, useMemo } from 'react';
import {
	Field,
	TextInput,
	Icon,
	Scrollable,
	Select,
} from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { isEmail } from '../../../../utils/lib/isEmail.js';

export default function ParticipantForm({ formValues, formHandlers, availableRoles, ...props }) {
	const t = useTranslation();

	const {
		surname,
		name,
		patronymic,
		phone,
		email,
	} = formValues;

	const {
		handleSurname,
		handleName,
		handlePatronymic,
		handlePhone,
		handleEmail,
	} = formHandlers;

	return <Scrollable  { ...props }>
			<Field mb='x16'>
				{useMemo(() => <Field mb='x4' width='98%'>
					<Field.Label>{t('Surname')}</Field.Label>
					<Field.Row>
						<TextInput width='32%' flexGrow={1} value={surname} onChange={handleSurname}/>
						<TextInput width='32%' flexGrow={1} value={name} onChange={handleName}/>
						<TextInput width='32%' flexGrow={1} value={patronymic} onChange={handlePatronymic}/>
					</Field.Row>
				</Field>, [t, surname, handleSurname, name, handleName, patronymic, handlePatronymic])}
				{/* {useMemo(() => <Field mb='x4' width='98%'>
					<Field.Label>{t('Name')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={name} onChange={handleName}/>
					</Field.Row>
				</Field>, [t, name, handleName])}
				{useMemo(() => <Field mb='x4' width='98%'>
					<Field.Label>{t('Patronymic')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={patronymic} onChange={handlePatronymic}/>
					</Field.Row>
				</Field>, [t, patronymic, handlePatronymic])} */}
				{useMemo(() => <Field mb='x4' width='98%'>
					<Field.Label>{t('Phone_number')}</Field.Label>
					<Field.Row>
						<TextInput width='49%' flexGrow={1} value={phone} onChange={handlePhone}/>
						<TextInput width='49%' flexGrow={1} value={email} error={!isEmail(email) && email.length > 0 ? 'error' : undefined} onChange={handleEmail} addon={<Icon name='mail' size='x20'/>}/>
					</Field.Row>
				</Field>, [t, phone, handlePhone, email, handleEmail])}
				{/* {useMemo(() => <Field mb='x4' width='98%'>
					<Field.Label>{t('Email')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={email} error={!isEmail(email) && email.length > 0 ? 'error' : undefined} onChange={handleEmail} addon={<Icon name='mail' size='x20'/>}/>
					</Field.Row>
				</Field>, [t, email, handleEmail])} */}
			</Field>
		</Scrollable>;
	// </Field>;
}

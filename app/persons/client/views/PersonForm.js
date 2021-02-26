import React, { useCallback, useMemo } from 'react';
import { Box, Field, Icon, Margins, TextInput } from '@rocket.chat/fuselage';
import PhoneInput from 'react-phone-input-2';

import { isEmail } from '../../../utils';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../client/hooks/useForm';

export function useDefaultPersonForm() {
	const {
		values,
		handlers,
		reset,
		commit,
		hasUnsavedChanges,
	} = useForm({
		surname: '',
		name: '',
		patronymic: '',
		phone: '',
		email: '',
		organization: '',
		position: '',
	});

	return {
		values,
		handlers,
		reset,
		commit,
		hasUnsavedChanges,
	};
}

function PersonForm({ defaultValues = null, defaultHandlers = null }) {
	const t = useTranslation();
	const fieldMarginBlock = 'x4';
	const fieldWidth = '98%';

	const {
		values,
		handlers,
		reset,
		hasUnsavedChanges,
	} = useForm(defaultValues ?? {
		surname: '',
		name: '',
		patronymic: '',
		phone: '',
		email: '',
		organization: '',
		position: '',
	});

	const {
		surname,
		name,
		patronymic,
		phone,
		email,
		organization,
		position,
	} = values;

	const {
		handleSurname,
		handleName,
		handlePatronymic,
		handlePhone,
		handleEmail,
		handleOrganization,
		handlePosition,
	} = handlers;

	const onChangeField = useCallback((val, handler) => {
		// console.log({ val, handler, defaultHandlers });
		// console.log(defaultHandlers[handler.name]);
		handler(val);
		if (defaultHandlers && defaultHandlers[handler.name]) {
			defaultHandlers[handler.name](val);
		}
	}, [defaultHandlers]);

	return <Box display='flex' flexDirection='column'>
		<Margins all='x8'>

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Surname')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={surname} onChange={(val) => onChangeField(val, handleSurname)}/>
				</Field.Row>
			</Field>, [t, surname, handleSurname, onChangeField])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={name} onChange={(val) => onChangeField(val, handleName)}/>
				</Field.Row>
			</Field>, [t, name, handleName])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Patronymic')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={patronymic} onChange={(val) => onChangeField(val, handlePatronymic)}/>
				</Field.Row>
			</Field>, [t, patronymic, handlePatronymic])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Phone_number')}</Field.Label>
				<Field.Row>
					<PhoneInput
						inputStyle={{ width: '100%', borderWidth: '0.125rem', borderRadius: '0' }} value={phone} onChange={(val) => onChangeField(val, handlePhone)} country={'ru'}
						countryCodeEditable={false} placeholder={'+7 (123)-456-78-90'}/>
				</Field.Row>
			</Field>, [t, phone, handlePhone])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Email')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={email} error={!isEmail(email) && email.length > 0 ? 'error' : undefined} onChange={(val) => onChangeField(val, handleEmail)} addon={<Icon name='mail' size='x20'/>}/>
				</Field.Row>
			</Field>, [t, email, handleEmail])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Position')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={position} onChange={(val) => onChangeField(val, handlePosition)}/>
				</Field.Row>
			</Field>, [t, position, handlePosition])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Organization')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={organization} onChange={(val) => onChangeField(val, handleOrganization)}/>
				</Field.Row>
			</Field>, [t, organization, handleOrganization])}
		</Margins>
	</Box>;
}

export default PersonForm;

import React, { useCallback, useMemo } from 'react';
import { Box, Button, ButtonGroup, Field, Icon, Margins, TextInput, Select } from '@rocket.chat/fuselage';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import { isEmail } from '../../../utils';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../client/hooks/useForm';
import { checkNumber } from '../../../utils/client/methods/checkNumber';

const DEFAULT_WEIGHT_PERSON = 100;

export function useDefaultPersonForm({ defaultValues = null, isContactPerson = false }) {
	const defaultFields = {
		weight: DEFAULT_WEIGHT_PERSON,
		surname: '',
		name: '',
		patronymic: '',
		phone: '',
		email: '',
		organization: '',
		position: '',
		group: '',
	};
	const contactFields = {
		surname: '',
		name: '',
		patronymic: '',
		phone: '',
		email: '',
	};

	const fields = useMemo(() => isContactPerson ? contactFields : defaultValues ?? defaultFields, [isContactPerson, defaultValues]);
	// useMemo(() => console.log({ fields }), [fields]);
	const {
		values,
		handlers,
		reset,
		commit,
		hasUnsavedChanges,
	} = useForm(fields);

	const allFieldAreFilled = useMemo(() => Object.values(values).filter((val) => {
		if (typeof val === 'string' && val.trim() !== '') { return false; }
		if (typeof val === 'object' && val?.length > 0) { return false; }
		return val?.toString().trim() === '';
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

function PersonForm({
	defaultValues = null,
	defaultHandlers = null,
	isWeight = true,
	onShowCancelAndSaveButtons = false,
	onCancel = null,
	onSave = null,
	workingGroupOptions,
}) {
	const t = useTranslation();
	const fieldMarginBlock = 'x4';
	const fieldWidth = '98%';

	const {
		values,
		handlers,
		allFieldAreFilled,
	} = useDefaultPersonForm({ defaultValues });

	const {
		weight,
		surname,
		name,
		patronymic,
		phone,
		email,
		organization,
		position,
		group,
	} = defaultValues ?? values;

	const {
		handleWeight,
		handleSurname,
		handleName,
		handlePatronymic,
		handlePhone,
		handleEmail,
		handleOrganization,
		handlePosition,
		handleGroup,
	} = defaultHandlers ?? handlers;

	const filterNumber = useCallback((value) => {
		if (checkNumber(value) !== null) {
			handleWeight(value);
		}
	}, [handleWeight]);

	return <Box display='flex' flexDirection='column'>
		<Margins all='x8'>

			{useMemo(() => isWeight && <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Weight')}</Field.Label>
				<Field.Row>
					<TextInput value={weight} onChange={(e) => filterNumber(e.currentTarget.value)}/>
				</Field.Row>
			</Field>, [t, weight, filterNumber])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Surname')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={surname} onChange={(val) => handleSurname(val)}/>
				</Field.Row>
			</Field>, [t, surname, handleSurname])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={name} onChange={(val) => handleName(val)}/>
				</Field.Row>
			</Field>, [t, name, handleName])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Patronymic')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={patronymic} onChange={(val) => handlePatronymic(val)}/>
				</Field.Row>
			</Field>, [t, patronymic, handlePatronymic])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Phone_number')}</Field.Label>
				<Field.Row>
					<PhoneInput
						inputStyle={{ width: '100%', borderWidth: '0.125rem', borderRadius: '0' }} value={phone} onChange={(val) => handlePhone(val )} country={'ru'}
						countryCodeEditable={false} placeholder={'+7 (123)-456-78-90'}/>
				</Field.Row>
			</Field>, [t, phone, handlePhone])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Email')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={email} error={!isEmail(email) && email.length > 0 ? 'error' : undefined} onChange={(val) => handleEmail(val)} addon={<Icon name='mail' size='x20'/>}/>
				</Field.Row>
			</Field>, [t, email, handleEmail])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Position')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={position} onChange={(val) => handlePosition(val)}/>
				</Field.Row>
			</Field>, [t, position, handlePosition])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Organization')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={organization} onChange={(val) => handleOrganization(val)}/>
				</Field.Row>
			</Field>, [t, organization, handleOrganization])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Group')}</Field.Label>
				<Select flexGrow={1} value={group?._id} onChange={(val) => handleGroup(val)} options={workingGroupOptions} />
			</Field>, [t, group, handleGroup, workingGroupOptions])}

			{onShowCancelAndSaveButtons && <ButtonGroup mb='x16'>
				<Button flexGrow={1} onClick={() => !!onCancel && onCancel()}>{t('Cancel')}</Button>
				<Button primary mie='none' flexGrow={1} disabled={!allFieldAreFilled} onClick={() => !!onSave && onSave(values)}>{t('Save')}</Button>
			</ButtonGroup>}
		</Margins>
	</Box>;
}

export default PersonForm;

export function ContactPersonForm({ defaultValues = null, defaultHandlers = null }) {
	const t = useTranslation();
	const fieldMarginBlock = 'x4';
	const fieldWidth = '98%';

	const {
		values,
		handlers,
	} = useDefaultPersonForm({ defaultValues, isContactPerson: true });

	const {
		surname,
		name,
		patronymic,
		phone,
		email,
	} = defaultValues ?? values;

	const {
		handleSurname,
		handleName,
		handlePatronymic,
		handlePhone,
		handleEmail,
	} = defaultHandlers ?? handlers;

	return <Box display='flex' flexDirection='column'>
		<Margins all='x8'>

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Surname')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={surname} onChange={(val) => handleSurname(val)}/>
				</Field.Row>
			</Field>, [t, surname, handleSurname])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={name} onChange={(val) => handleName(val)}/>
				</Field.Row>
			</Field>, [t, name, handleName])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Patronymic')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={patronymic} onChange={(val) => handlePatronymic(val)}/>
				</Field.Row>
			</Field>, [t, patronymic, handlePatronymic])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Phone_number')}</Field.Label>
				<Field.Row>
					<PhoneInput
						inputStyle={{ width: '100%', borderWidth: '0.125rem', borderRadius: '0' }} value={phone} onChange={(val) => handlePhone(val)} country={'ru'}
						countryCodeEditable={false} placeholder={'+7 (123)-456-78-90'}/>
				</Field.Row>
			</Field>, [t, phone, handlePhone])}

			{useMemo(() => <Field mb={ fieldMarginBlock } width={ fieldWidth }>
				<Field.Label>{t('Email')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={email} error={!isEmail(email) && email.length > 0 ? 'error' : undefined} onChange={(val) => handleEmail(val)} addon={<Icon name='mail' size='x20'/>}/>
				</Field.Row>
			</Field>, [t, email, handleEmail])}
		</Margins>
	</Box>;
}

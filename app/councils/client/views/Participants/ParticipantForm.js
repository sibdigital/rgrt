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

export default function ParticipantForm({ formValues, formHandlers, workingGroupOptions, availableRoles, append, ...props }) {
	const t = useTranslation();

	const {
		surname,
		name,
		patronymic,
		organization,
		position,
		phone,
		email,
		workingGroup,
	} = formValues;

	const {
		handleSurname,
		handleName,
		handlePatronymic,
		handleOrganization,
		handlePosition,
		handlePhone,
		handleEmail,
		handleWorkingGroup,
	} = formHandlers;

	// const workingGroupOptions = useMemo(() => {
	// 	const res = [[null, t('Not_chosen')]];
	// 	return res.concat(workingGroups?.map((workingGroup) => [workingGroup.title, workingGroup.title]));
	// }, [workingGroups]);
	// const workingGroupOptions = useMemo(() => [
	// 	['Не выбрано', t('Not_chosen')],
	// 	['Члены рабочей группы', 'Члены рабочей группы'],
	// 	['Представители субъектов Российской Федерации', 'Представители субъектов Российской Федерации'],
	// 	['Иные участники', 'Иные участники'],
	// ], [t]);
	// is='form' onSubmit={useCallback((e) => e.preventDefault(), [])}

	return <Scrollable  { ...props }>
			<Field mb='x16'>
				{useMemo(() => <Field mb='x4' width='98%'>
					<Field.Label>{t('Surname')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={surname} onChange={handleSurname}/>
					</Field.Row>
				</Field>, [t, surname, handleSurname])}
				{useMemo(() => <Field mb='x4' width='98%'>
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
				</Field>, [t, patronymic, handlePatronymic])}
				{useMemo(() => <Field mb='x4' width='98%'>
					<Field.Label>{t('Organization')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={organization} onChange={handleOrganization}/>
					</Field.Row>
				</Field>, [t, organization, handleOrganization])}
				{useMemo(() => <Field mb='x4' width='98%'>
					<Field.Label>{t('Position')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={position} onChange={handlePosition}/>
					</Field.Row>
				</Field>, [t, position, handlePosition])}
				{useMemo(() => <Field mb='x4' width='98%'>
					<Field.Label>{t('Phone_number')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={phone} onChange={handlePhone}/>
					</Field.Row>
				</Field>, [t, phone, handlePhone])}
				{useMemo(() => <Field mb='x4' width='98%'>
					<Field.Label>{t('Email')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={email} error={!isEmail(email) && email.length > 0 ? 'error' : undefined} onChange={handleEmail} addon={<Icon name='mail' size='x20'/>}/>
					</Field.Row>
				</Field>, [t, email, handleEmail])}
				{useMemo(() => <Field mbe='x8' width='98%'>
					<Field.Label flexGrow={0}>{t('Working_group')}</Field.Label>
					<Field.Row>
						<Select options={workingGroupOptions} onChange={handleWorkingGroup} value={workingGroup} selected={workingGroup}/>
					</Field.Row>
				</Field>, [t, workingGroup, handleWorkingGroup])}
			</Field>
		</Scrollable>;
	// </Field>;
}

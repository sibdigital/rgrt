import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Field,
	TextInput,
	TextAreaInput,
	PasswordInput,
	MultiSelectFiltered,
	Box,
	ToggleSwitch,
	Icon,
	Divider,
	FieldGroup,
	Select,
} from '@rocket.chat/fuselage';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import { useTranslation } from '../../contexts/TranslationContext';
import { isEmail } from '../../../app/utils/lib/isEmail.js';
import VerticalBar from '../../components/basic/VerticalBar';
import CustomFieldsForm from '../../components/CustomFieldsForm';

export default function UserForm({ formValues, formHandlers, availableRoles, persons, workingGroups, append, prepend, ...props }) {
	const t = useTranslation();
	const [hasCustomFields, setHasCustomFields] = useState(false);

	const {
		surname,
		name,
		patronymic,
		username,
		email,
		verified,
		statusText,
		organization,
		position,
		phone,
		bio,
		personId,
		workingGroup,
		nickname,
		password,
		setRandomPassword,
		requirePasswordChange,
		roles,
		customFields,
		joinDefaultChannels,
		sendWelcomeEmail,
	} = formValues;

	const {
		handleSurname,
		handleName,
		handlePatronymic,
		handleUsername,
		handleEmail,
		handleVerified,
		handleStatusText,
		handleOrganization,
		handlePosition,
		handlePhone,
		handleBio,
		handlePersonId,
		handleWorkingGroup,
		handleNickname,
		handlePassword,
		handleSetRandomPassword,
		handleRequirePasswordChange,
		handleRoles,
		handleCustomFields,
		handleJoinDefaultChannels,
		handleSendWelcomeEmail,
	} = formHandlers;

	const onLoadCustomFields = useCallback((hasCustomFields) => setHasCustomFields(hasCustomFields), []);

	const workingGroupOptions = useMemo(() => {
		const res = [[null, t('Not_chosen')]];
		if (workingGroups?.length > 0) {
			return res.concat(workingGroups.map((workingGroup) => [workingGroup._id, workingGroup.title]));
		}
		return res;
	}, [workingGroups]);

	const personsOptions = useMemo(() => {
		const res = [['', t('Not_chosen')]];
		if (persons?.persons?.length > 0) {
			return res.concat(persons?.persons.map((person) => [person._id, [person.surname, person.name, person.patronymic].join(' ')]));
		}
		return res;
	}, [persons]);

	const person = persons?.persons.filter((person) => person._id === personId)[0];

	console.log(phone);
	const autofillDataFromPerson = (person) => {
		handleSurname(person.surname);
		handleName(person.name);
		handlePatronymic(person.patronymic);
		handlePersonId(person._id);
		handlePosition(person.position);
		handleOrganization(person.organization);
		handleWorkingGroup(person.group?._id);
		handlePhone(person.phone);
		handleEmail(person.email);
	}

	const resetFilledData = (person) => {
		handleSurname('');
		handleName('');
		handlePatronymic('');
		handlePersonId('');
		handlePosition('');
		handleOrganization('');
		handleWorkingGroup('');
		handlePhone('7');
		handleEmail('');
	};

	useEffect(() => {
		person?._id ? autofillDataFromPerson(person) : resetFilledData(person);
	}, [person]);

	return <VerticalBar.ScrollableContent is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} { ...props }>
		<FieldGroup>
			{ prepend }
			{useMemo(() => <Field>
				<Field.Label>{t('Person')}</Field.Label>
				<Field.Row>
					<Select options={personsOptions} onChange={handlePersonId} value={personId} selected={personId}/>
				</Field.Row>
			</Field>, [t, personId, handlePersonId])}
			{useMemo(() => <Field>
				<Field.Label>{t('Surname')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={surname} onChange={handleSurname}/>
				</Field.Row>
			</Field>, [t, surname, handleSurname])}
			{useMemo(() => <Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={name} onChange={handleName}/>
				</Field.Row>
			</Field>, [t, name, handleName])}
			{useMemo(() => <Field>
				<Field.Label>{t('Patronymic')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={patronymic} onChange={handlePatronymic}/>
				</Field.Row>
			</Field>, [t, patronymic, handlePatronymic])}
			{useMemo(() => <Field>
				<Field.Label>{t('Username')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={username} onChange={handleUsername} addon={<Icon name='at' size='x20'/>}/>
				</Field.Row>
			</Field>, [t, username, handleUsername])}
			{useMemo(() => <Field>
				<Field.Label>{t('Organization')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={organization} onChange={handleOrganization}/>
				</Field.Row>
			</Field>, [t, organization, handleOrganization])}
			{useMemo(() => <Field>
				<Field.Label>{t('Position')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={position} onChange={handlePosition}/>
				</Field.Row>
			</Field>, [t, position, handlePosition])}
			{useMemo(() => <Field>
				<Field.Label>{t('Phone_number')}</Field.Label>
				<Field.Row>
					<PhoneInput
						inputStyle={{ width: '100%', borderWidth: '0.125rem', borderRadius: '0' }} value={phone} onChange={(val) => handlePhone(val)} country={'ru'}
						countryCodeEditable={false} placeholder={'+7 (123)-456-78-90'}/>
				</Field.Row>
			</Field>, [t, phone, handlePhone])}
			{useMemo(() => <Field>
				<Field.Label>{t('Email')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={email} error={!isEmail(email) && email.length > 0 ? 'error' : undefined} onChange={handleEmail} addon={<Icon name='mail' size='x20'/>}/>
				</Field.Row>
				<Field.Row>
					<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' mbs='x4'>
						<Box>{t('Verified')}</Box><ToggleSwitch checked={verified} onChange={handleVerified} />
					</Box>
				</Field.Row>
			</Field>, [t, email, handleEmail, verified, handleVerified])}
			{useMemo(() => <Field mie='x8'>
				<Field.Label flexGrow={0}>{t('Group')}</Field.Label>
				<Field.Row>
					<Select options={workingGroupOptions} onChange={handleWorkingGroup} value={workingGroup} selected={workingGroup}/>
				</Field.Row>
			</Field>, [t, workingGroup, handleWorkingGroup])}
			{useMemo(() => <Field>
				<Field.Label>{t('StatusMessage')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={statusText} onChange={handleStatusText} addon={<Icon name='edit' size='x20'/>}/>
				</Field.Row>
			</Field>, [t, statusText, handleStatusText])}
			{useMemo(() => <Field>
				<Field.Label>{t('Description')}</Field.Label>
				<Field.Row>
					<TextAreaInput rows={3} flexGrow={1} value={bio} onChange={handleBio} addon={<Icon name='edit' size='x20' alignSelf='center'/>}/>
				</Field.Row>
			</Field>, [bio, handleBio, t])}
			{useMemo(() => <Field>
				<Field.Label>{t('Nickname')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={nickname} onChange={handleNickname} addon={<Icon name='edit' size='x20' alignSelf='center'/>}/>
				</Field.Row>
			</Field>, [nickname, handleNickname, t])}
			{useMemo(() => <Field>
				<Field.Label>{t('Password')}</Field.Label>
				<Field.Row>
					<PasswordInput autoComplete='off' flexGrow={1} value={password} onChange={handlePassword} addon={<Icon name='key' size='x20'/>}/>
				</Field.Row>
			</Field>, [t, password, handlePassword])}
			{useMemo(() => <Field>
				<Field.Row>
					<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
						<Box>{t('Require_password_change')}</Box><ToggleSwitch disabled={setRandomPassword} checked={setRandomPassword || requirePasswordChange} onChange={handleRequirePasswordChange} />
					</Box>
				</Field.Row>
			</Field>, [t, setRandomPassword, requirePasswordChange, handleRequirePasswordChange])}
			{useMemo(() => <Field>
				<Field.Row>
					<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
						<Box>{t('Set_random_password_and_send_by_email')}</Box><ToggleSwitch checked={setRandomPassword} onChange={handleSetRandomPassword} />
					</Box>
				</Field.Row>
			</Field>, [t, setRandomPassword, handleSetRandomPassword])}
			{useMemo(() => <Field>
				<Field.Label>{t('Roles')}</Field.Label>
				<Field.Row>
					<MultiSelectFiltered options={availableRoles} value={roles} onChange={handleRoles} placeholder={t('Select_role')} flexShrink={1}/>
				</Field.Row>
			</Field>, [availableRoles, handleRoles, roles, t])}
			{useMemo(() => handleJoinDefaultChannels && <Field>
				<Field.Row>
					<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
						<Box>{t('Join_default_channels')}</Box><ToggleSwitch checked={joinDefaultChannels} onChange={handleJoinDefaultChannels} />
					</Box>
				</Field.Row>
			</Field>, [handleJoinDefaultChannels, t, joinDefaultChannels])}
			{useMemo(() => handleSendWelcomeEmail && <Field>
				<Field.Row>
					<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
						<Box>{t('Send_welcome_email')}</Box><ToggleSwitch checked={sendWelcomeEmail} onChange={handleSendWelcomeEmail} />
					</Box>
				</Field.Row>
			</Field>, [handleSendWelcomeEmail, t, sendWelcomeEmail])}
			{hasCustomFields && <>
				<Divider />
				<Box fontScale='s2'>{t('Custom_Fields')}</Box>
			</>}
			<CustomFieldsForm onLoadFields={onLoadCustomFields} customFieldsData={customFields} setCustomFieldsData={handleCustomFields}/>
			{ append }
		</FieldGroup>
	</VerticalBar.ScrollableContent>;
}

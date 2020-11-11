import React, { useCallback, useMemo, useState } from 'react';
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

import { useTranslation } from '../../contexts/TranslationContext';
import { isEmail } from '../../../app/utils/lib/isEmail.js';
import VerticalBar from '../../components/basic/VerticalBar';
import CustomFieldsForm from '../../components/CustomFieldsForm';

export default function UserForm({ formValues, formHandlers, availableRoles, append, prepend, ...props }) {
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

	const workingGroupOptions = useMemo(() => [
		['Не выбрано', t('Not_chosen')],
		['Члены рабочей группы', 'Члены рабочей группы'],
		['Представители субъектов Российской Федерации', 'Представители субъектов Российской Федерации'],
		['Иные участники', 'Иные участники'],
	], [t]);

	return <VerticalBar.ScrollableContent is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} { ...props }>
		<FieldGroup>
			{ prepend }
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
					<TextInput flexGrow={1} value={phone} onChange={handlePhone}/>
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

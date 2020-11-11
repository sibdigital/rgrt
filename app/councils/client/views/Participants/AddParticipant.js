import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Box,
	Button,
	ButtonGroup,
	Icon,
	TextInput,
	Tile,
	Scrollable,
	Margins,
	Field,
	CheckBox, Table, Label,
} from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { css } from '@rocket.chat/css-in-js';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';
import { useMethod } from '../../../../../client/contexts/ServerContext';

const clickable = css`
		cursor: pointer;
		// border-bottom: 2px solid #F2F3F5 !important;
		&:hover,
		&:focus {
			background: #F7F8FA;
		}
	`;

const SearchByText = ({ setParams, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setParams({ text });
	}, [setParams, text]);

	return <Box mbe='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput flexShrink={0} placeholder={t('Search_Users')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, username: 1, emails: 1,
		surname: 1, patronymic: 1, organization: 1, position: 1, phone: 1 }),
	query: JSON.stringify({
		$or: [
			{ 'emails.address': { $regex: text || '', $options: 'i' } },
			{ username: { $regex: text || '', $options: 'i' } },
			{ name: { $regex: text || '', $options: 'i' } },
			{ surname: { $regex: text || '', $options: 'i' } },
		],
		$and: [
			{ type: { $ne: 'bot' } }
		]
	}),
	sort: JSON.stringify({ [column]: sortDir(direction), usernames: column === 'name' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, itemsPerPage, current, column, direction]);

export function AddParticipant({ councilId, onChange, close, invitedUsers, onNewParticipant }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);
	const [countSelectedUsers, setCountSelectedUsers] = useState(0);
	const [usersIdToAdd, setUsersIdToAdd] = useState([]);
	const addUsersToCouncil = useMethod('addUsersToCouncil');

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);

	const data = useEndpointData('users.list', query) || { users: [] };
	//const invitedUsersData = useEndpointData('councils.invitedUsers', query) || { invitedUsers: [] };

	const usersWithoutCurrentCouncil = data.users ? data.users.filter((user) =>
		invitedUsers.findIndex((invitedUser) => invitedUser === user._id) < 0)
		: [];

	const onAddUserCancelClick = () => {
		close();
	};

	const saveAction = useCallback(async () => {
		await addUsersToCouncil(councilId, usersIdToAdd);
	}, [dispatchToastMessage, addUsersToCouncil]);

	const handleSave = useCallback(async () => {
		try {
			if (usersIdToAdd.length > 0) {
				await saveAction();
				dispatchToastMessage({ type: 'success', message: t('Participant_Added_Successfully') });
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onChange();
			close();
		}
	}, [dispatchToastMessage, saveAction, t]);

	const onAddClick = (_id) => () => {
		const index = usersIdToAdd.indexOf(_id);
		if (index < 0) {
			usersIdToAdd.push(_id);
		} else {
			usersIdToAdd.splice(index, 1);
		}
		setCountSelectedUsers(usersIdToAdd.length);
		onChange();
	};

	return <>
		<Field mbe='x8'>
			<Label fontScale='p1'>{t('Selected')}: {countSelectedUsers}</Label>
			<ButtonGroup marginInlineStart='auto'>
				<Button onClick={onAddUserCancelClick} small primary aria-label={t('Cancel')}>
					{t('Cancel')}
				</Button>
				<Button onClick={handleSave} small primary aria-label={t('Save')}>
					{t('Save')}
				</Button>
			</ButtonGroup>
		</Field>
		<SearchByText setParams={ setParams }/>
		{ data.users && !data.users.length
			? <>
				<Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
					{ t('No_data_found') }
				</Tile>
				{ params.text !== '' && <Button
					mbe='x8' primary aria-label={ t('New') } onClick={onNewParticipant('newParticipants')}>
					{ t('Participant_Create') }
				</Button> }
			</>
			: <>
				<UsersTable invitedUsers={ usersWithoutCurrentCouncil } usersIdToAdd={ usersIdToAdd } handleAddUser={ onAddClick }/>
			</>
		}
	</>;
}

const style = { textOverflow: 'ellipsis', overflow: 'hidden' };

function UsersTable({ invitedUsers, usersIdToAdd, handleAddUser }) {
	const t = useTranslation();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const header = useMemo(() => [
		<Th key={'fio'} color='default'>{t('Council_participant')}</Th>,
		<Th key={'organization'} color='default'>{t('Organization')}</Th>,
		mediaQuery && <Th key={'position'} color='default'>{t('Position')}</Th>,
		mediaQuery && <Th key={'phone'} color='default'>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'email'} color='default'>{t('Email')}</Th>,
	], [mediaQuery]);

	const styleTableRow = { wordWrap: 'break-word' };

	const getBackgroundColor = (invitedUser) => {
		const index = invitedUsers.findIndex((user) => (
			user.name === invitedUser.name
			&& user.surname === invitedUser.surname
			&& user.patronymic === invitedUser.patronymic
			&& user.username === invitedUser.username
			&& user.organization === invitedUser.organization
			&& user.position === invitedUser.position
			&& user.phone === invitedUser.phone
			&& user.emails === invitedUser.emails
			&& user.ts === invitedUser.ts
		));
		if (usersIdToAdd && usersIdToAdd.findIndex((userId) => invitedUser._id === userId) > -1) {
			return 'var(--list-selected-element-background-color)';
		}
		if (index > 0 && index % 2 === 1) {
			return 'var(--list-even-element-background-color)';
		}

		return 'var(--list-element-background-color)';
	};

	const renderRow = (invitedUser) => {
		const iu = invitedUser;
		const email = iu.emails ? iu.emails[0].address : '';
		return <Table.Row key={iu._id} style={styleTableRow} onClick={handleAddUser(iu._id)} backgroundColor={getBackgroundColor(invitedUser)} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' style={style} color='default'>{iu.surname} {iu.name} {iu.patronymic}</Table.Cell>
			<Table.Cell fontScale='p1' style={style} color='default'>{iu.organization}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.position}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{email}</Table.Cell>}
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={invitedUsers} total={invitedUsers.length} setParams={setParams} params={params} />;
}


function AddInvitedUser({ invitedUser, handleCancel, handleInsertOrUpdateSubmit }) {
	const [newData, setNewData] = useState({
		surname: { value: invitedUser.surname ?? '', required: true },
		name: { value: invitedUser.name ?? '', required: true },
		patronymic: { value: invitedUser.patronymic ?? '', required: false },
		organization: { value: invitedUser.organization ?? '', required: true },
		position: { value: invitedUser.position ?? '', required: true },
		contactPersonFirstName: { value: invitedUser.contactPersonFirstName ?? '', required: false },
		contactPersonLastName: { value: invitedUser.contactPersonLastName ?? '', required: false },
		contactPersonPatronymicName: { value: invitedUser.contactPersonPatronymicName ?? '', required: false },
		phone: { value: invitedUser.phone ?? '', required: true },
		email: { value: invitedUser.emails ? invitedUser.emails[0].address : '', required: true },
		ts: { value: invitedUser.ts ?? '', required: false },
	});

	const isContact = !!(invitedUser.contactPersonFirstName && invitedUser.contactPersonLastName);

	const [isContactPerson, setIsContactPerson] = useState(isContact);

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		setNewData({ ...newData, [field]: { value: getValue(e), required: newData[field].required } });
	};

	const packNewData = () => {
		const dataToSend = {};
		Object.keys(newData).forEach((key) => {
			dataToSend[key] = newData[key].value.trim();
		});
		if (!isContactPerson) {
			delete dataToSend.contactPersonFirstName;
			delete dataToSend.contactPersonLastName;
			delete dataToSend.contactPersonPatronymicName;
		}
		if (!dataToSend.ts) {
			dataToSend.ts = new Date();
		}
		return dataToSend;
	};

	const handleIAmContactPerson = () => {
		setNewData({
			...newData,
			contactPersonFirstName: { value: newData.contactPersonFirstName.value, required: !isContactPerson },
			contactPersonLastName: { value: newData.contactPersonLastName.value, required: !isContactPerson },
		});
		setIsContactPerson(!isContactPerson);
	};

	const t = useTranslation();

	const allFieldAreFilled = useMemo(() => Object.values(newData).filter((current) => current.value === '' && current.required === true).length === 0, [JSON.stringify(newData)]);

	console.log('allFieldAreFilled', allFieldAreFilled);

	const inputsStyle = { width: '99%' };

	return <Margins blockStart='x32' blockEnd='x32'>
		<Box height='100%'>
			<Box display='flex' fontScale='s1' color='hint' marginBlockEnd='x16'>
				<Field.Label width='auto'>{t('Council_participant_info_description')}</Field.Label>
				<ButtonGroup>
					<Button fontSize={'1.1rem'} primary small aria-label={t('Cancel')} onClick={handleCancel}>
						{t('Cancel')}
					</Button>
					<Button fontSize={'1.1rem'} disabled={!allFieldAreFilled} primary small aria-label={t('Accept')} onClick={handleInsertOrUpdateSubmit(packNewData(), invitedUser)}>
						{t('Accept')}
					</Button>
				</ButtonGroup>
			</Box>
			<Box display='flex' flexDirection='column' overflow='auto' height='85%'>
				<Margins all='x8'>
					<Field style={inputsStyle}>
						<Field.Label>{t('Council_second_name')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.surname.value} flexGrow={1} onChange={handleChange('lastName')} placeholder={`${ t('Council_second_name_placeholder') }`}/>
						</Field.Row>
					</Field>
					<Field style={inputsStyle}>
						<Field.Label>{t('Council_first_name')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.name.value} flexGrow={1} onChange={handleChange('firstName')} placeholder={`${ t('Council_first_name_placeholder') }`}/>
						</Field.Row>
					</Field>
					<Field style={inputsStyle}>
						<Field.Label>{t('Council_patronymic')}</Field.Label>
						<Field.Row>
							<TextInput value={newData.patronymic.value} flexGrow={1} onChange={handleChange('patronymic')} placeholder={`${ t('Council_patronymic_placeholder') }`} />
						</Field.Row>
					</Field>
					<Field style={inputsStyle}>
						<Field.Label>{t('Council_Organization_Position')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.organization.value + ' ' + newData.position.value} flexGrow={1} onChange={handleChange('position')} placeholder={`${ t('Council_Organization_Position_placeholder') }`}/>
						</Field.Row>
					</Field>
					<Field.Row style={inputsStyle}>
						<CheckBox checked={isContactPerson} onChange={handleIAmContactPerson}/>
						<Field.Label>{t('Council_Is_Contact_person')}</Field.Label>
					</Field.Row>
					{ isContactPerson && <Field style={inputsStyle}>
						<Field.Label>{t('Council_Contact_person_lastname')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.contactPersonLastName.value} flexGrow={1} onChange={handleChange('contactPersonLastName')} placeholder={`${ t('Council_Contact_person_lastname_placeholder') } (${ t('Required') })`}/>
						</Field.Row>
					</Field> }
					{ isContactPerson && <Field style={inputsStyle}>
						<Field.Label>{t('Council_Contact_person_firstname')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.contactPersonFirstName.value} flexGrow={1} onChange={handleChange('contactPersonFirstName')} placeholder={`${ t('Council_Contact_person_firstname_placeholder') } (${ t('Required') })`}/>
						</Field.Row>
					</Field> }
					{ isContactPerson && <Field style={inputsStyle}>
						<Field.Label>{t('Council_Contact_person_patronymic')}</Field.Label>
						<Field.Row>
							<TextInput value={newData.contactPersonPatronymicName.value} flexGrow={1} onChange={handleChange('contactPersonPatronymicName')} placeholder={`${ t('Council_Contact_person_patronymic_placeholder') } (${ t('optional') })`}/>
						</Field.Row>
					</Field> }
					<Field style={inputsStyle}>
						<Field.Label>{t('Council_Contact_person_Phone_number')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.phone.value} flexGrow={1} onChange={handleChange('phone')} placeholder={`${ t('Council_Contact_person_Phone_number_placeholder') }`}/>
						</Field.Row>
					</Field>
					<Field style={inputsStyle}>
						<Field.Label>{t('Council_Contact_person_email')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.email.value} flexGrow={1} onChange={handleChange('email')} placeholder={`${ t('Council_Contact_person_email_placeholder') }`}/>
						</Field.Row>
					</Field>
				</Margins>
			</Box>
		</Box>
	</Margins>;
}

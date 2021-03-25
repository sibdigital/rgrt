import React, { useMemo, useState, useEffect } from 'react';
import { Field, Label, Callout } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import '../../public/stylesheets/mail-sender.css';
import Page from '../../../../client/components/basic/Page';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useUser } from '../../../../client/contexts/UserContext';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import MailForm from './MailForm';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = (params, sort) => useMemo(() => ({
	fields: JSON.stringify({ surname: 1, name: 1, patronymic: 1, username: 1, emails: 1, workingGroup: 1 }),
	query: JSON.stringify({
		$or: [
			{ 'emails.address': { $regex: params.text || '', $options: 'i' } },
			{ username: { $regex: params.text || '', $options: 'i' } },
			{ name: { $regex: params.text || '', $options: 'i' } },
		],
	}),
	sort: JSON.stringify({ [sort[0]]: sortDir(sort[1]), usernames: sort[0] === 'name' ? sortDir(sort[1]) : undefined }),
}), [params, sort]);

const useWorkingGroupsQuery = (params, sort) => useMemo(() => ({
	sort: JSON.stringify({ [sort[0]]: sortDir(sort[1]), titles: sort[0] === 'title' ? sortDir(sort[1]) : undefined }),
	query: JSON.stringify({ type: { $ne: 'subject' } }),
}), [params, sort]);

const useCouncilQuery = (params, sort, _id) => useMemo(() => ({
	query: JSON.stringify({ _id }),
	fields: JSON.stringify({ invitedUsers: 1 }),
	sort: JSON.stringify({ [sort[0]]: sortDir(sort[1]), id: sort[0] === '_id' ? sortDir(sort[1]) : undefined }),
}), [params, sort, _id]);

const useErrandQuery = (params, sort, _id) => useMemo(() => ({
	query: JSON.stringify({
		_id,
	}),
}), [params, sort, _id]);

const invitedUsersQuery = ({ itemsPerPage, current }, [column, direction], councilId) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, username: 1, emails: 1, surname: 1, patronymic: 1, organization: 1, position: 1, phone: 1 }),
	query: JSON.stringify({
		$or: [
			{ 'emails.address': { $regex: '', $options: 'i' } },
			{ username: { $regex: '', $options: 'i' } },
			{ name: { $regex: '', $options: 'i' } },
			{ surname: { $regex: '', $options: 'i' } },
		],
		$and: [
			{ type: { $ne: 'bot' } },
			{ _id: councilId },
		],
	}),
	sort: JSON.stringify({ [column]: sortDir(direction), usernames: column === 'name' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [itemsPerPage, current, councilId, column, direction]);

const assignObjectPaths = (obj, stack) => {
	const isArray = Array.isArray(obj);
	Object.keys(obj).forEach((k) => {
		const node = obj[k];
		const key = isArray ? `[${k}]` : k;
		if (typeof node === 'object') {
			node.path = stack ? `${stack}.${key}` : key;
			assignObjectPaths(node, node.path);
		}
	});
};

export function MailSenderPage() {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const [params, setParams] = useState({ text: '' });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const workingGroupsQuery = useWorkingGroupsQuery(debouncedParams, debouncedSort);

	const data = useEndpointData('users.all', query) || {};

	const workingGroupsData = useEndpointData('working-groups.list', workingGroupsQuery) || {};

	return <Page>
		<Page.Header>
			<Field width={'100%'} display={'block'} marginBlock={'15px'}>
				<GoBackButton/>
				<Label fontScale='h1'>{t('Send_email')}</Label>
			</Field>
		</Page.Header>
		<Page.Content>
			{context === undefined && <MailSender workingGroupsData={workingGroupsData} usersData={data.users}/>}
			{context === 'council' && <MailSenderWithCouncil workingGroupsData={workingGroupsData} usersData={data.users} debouncedParams={debouncedParams} debouncedSort={debouncedSort} id={id}/>}
			{context === 'errand' && <MailSenderWithErrand workingGroupsData={workingGroupsData} usersData={data.items} debouncedParams={debouncedParams} debouncedSort={debouncedSort} id={id}/>}
		</Page.Content>
	</Page>;
}

MailSenderPage.displayName = 'MailSenderPage';

export default MailSenderPage;

function MailSender({ workingGroupsData, usersData }) {
	const [recipients, setRecipients] = useState([]);

	useEffect(() => {
		const workingGroups = workingGroupsData.workingGroups || [];
		const users = usersData || [];
		const recipients = [{
			label: 'Все пользователи',
			value: 'all_users',
			children: workingGroups.filter((workingGroup) => workingGroup.type !== 'subject').map((workingGroup) => {
				return {
					label: workingGroup.title,
					value: workingGroup._id,
					children: users.filter((user) => user.workingGroup === workingGroup.title).map((value) => {
						return {
							label: [value.surname, value.name, value.patronymic].join(' '),
							value: value.emails ? value.emails[0].address : '',
						};
					}),
				};
			}),
		}];

		assignObjectPaths(recipients);

		setRecipients(recipients);
	}, [workingGroupsData, usersData]);

	return <MailForm recipients={recipients}/>;
}

function MailSenderWithCouncil({ workingGroupsData, usersData, debouncedParams, debouncedSort, id }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const councilQuery = useCouncilQuery(debouncedParams, debouncedSort, id);

	const { data: councilData, state: councilState } = useEndpointDataExperimental('councils.findOne', councilQuery) || {};
	// const { data: invitedUsersData, state: invitedUsersState } = useEndpointDataExperimental('councils.invitedUsers', invitedUsersQuery(debouncedParams, debouncedSort, id)) || { invitedUsers: [] };
	const { data: invitedPersonsData, state: invitedPersonsState } = useEndpointDataExperimental('councils.invitedPersons', useMemo(() => ({ query: JSON.stringify({ _id: id }) }), [id])) || { persons: [] };

	const [recipients, setRecipients] = useState([]);
	const [defaultEmails, setDefaultEmails] = useState('');
	const [mailSubject, setMailSubject] = useState('');
	const [mailBody, setMailBody] = useState('');
	const [emailsArray, setEmailsArray] = useState([]);
	const label = t('Council_participants');

	useEffect(() => {
		const users = usersData || [];
		const invitedPersons = invitedPersonsData ? invitedPersonsData.persons : [];
		const workingGroups = workingGroupsData.workingGroups || [];
		if (councilData) {
			let emails = '';
			const emailsArr = [];
			let staticIndex = 0;
			const recipients = [{
				label: 'Все пользователи',
				value: 'all_users',
				children: workingGroups.map((workingGroup) => {
					const usersFilter = users.filter((user) => user.workingGroup === workingGroup.title && workingGroup.type !== 'subject');
					return {
						label: workingGroup.title,
						value: workingGroup._id,
						children: usersFilter.map((value) => {
							const email = value.emails ? value.emails[0].address : '';
							const name = [value.surname ?? t('Surname'), value.name ?? t('Name'), value.patronymic ?? t('Patronymic')].join(' ');
							if (email.length > 0) {
								staticIndex++;
								emailsArr.push({ index: staticIndex, value: email, tooltip: name });
							}
							return {
								label: name,
								value: email,
								index: staticIndex,
							};
						}),
					};
				}),
			}];

			let isChild = false;

			const getChildrens = (inviteds) => {
				const res = [];
				inviteds?.map((iPerson) => {
					if (!iPerson.email) {
						return;
					}
					isChild = true;
					emails += [iPerson.email, ','].join('');
					const name = [iPerson.surname ?? t('Surname'), iPerson.name ?? t('Name'), iPerson.patronymic ?? t('Patronymic')].join(' ');
					staticIndex++;
					emailsArr.push({ index: staticIndex, value: iPerson.email, tooltip: name });
					res.push({
						label: name,
						value: iPerson.email ?? '',
						index: staticIndex,
					});
					return '';
				});

				return res;
			};

			const child = invitedPersons ? {
				label,
				value: 'Council',
				isDefaultValue: true,
				children: !invitedPersons ? [] : getChildrens(invitedPersons),
			} : null;

			console.log(child);
			// console.log(invitedUsers);
			// console.log(usersData);

			if (isChild) {
				console.log('nule');
				recipients[0].children.push(child);
			}
			const mailSubject = [t('Council'), 'От', formatDateAndTime(councilData.d)].join(' ');

			setEmailsArray(emailsArr);
			setDefaultEmails(emails);
			setMailSubject(mailSubject);
			setMailBody(councilData.desc);
			setRecipients(recipients);
			assignObjectPaths(recipients);
		}
	}, [workingGroupsData, usersData, councilData, invitedPersonsData, formatDateAndTime]);

	if ([councilState, invitedPersonsState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
		return <MailForm recipients={[]} mailSubject={''} mailBody={''} defaultEmails={''} emailsArray={[]}/>;
	}

	return <MailForm recipients={recipients} mailSubject={mailSubject} mailBody={mailBody} defaultEmails={defaultEmails} emailsArray={emailsArray}/>;
}

function MailSenderWithErrand({ workingGroupsData, usersData, debouncedParams, debouncedSort, id }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const currentUser = useUser();
	const errandQuery = useErrandQuery(debouncedParams, debouncedSort, id);

	const { data: errandData, state: errandState } = useEndpointDataExperimental('errands.findOne', errandQuery);
	const { data: personData, state: personState } = useEndpointDataExperimental('persons.findOne', useMemo(() => ({query: JSON.stringify({_id: errandData?.chargedTo._id})}), [errandData]));

	const [recipients, setRecipients] = useState([]);
	const [defaultEmails, setDefaultEmails] = useState('');
	const [mailSubject, setMailSubject] = useState('');
	const [mailBody, setMailBody] = useState('');
	const [mailsArray, setMailsArray] = useState([]);

	const getErrandMailBody = (errand) => {
		let mailBody = '';

		if (errand) {
			mailBody += [errand.desc, '<br><br>'].join('');
			mailBody += [t('Errand_Expired_date'), ': ', formatDateAndTime(errand.expireAt)].join('');
		}

		return mailBody;
	};

	useEffect(() => {
		const users = usersData || [];
		const errand = errandData || {};
		const workingGroups = workingGroupsData.workingGroups || [];
		if (errandData) {
			const userToSendEmail = personData;

			const recipients = [{
				label: 'Все пользователи',
				value: 'all_users',
				children: workingGroups.map((workingGroup) => {
					return {
						label: workingGroup.title,
						value: workingGroup._id,
						children: users.filter((user) => user.workingGroup === workingGroup.title && workingGroup.type !== 'subject').map((value) => {
							return {
								label: [value.surname, value.name, value.patronymic].join(' '),
								value: value.emails ? value.emails[0].address : '',
							};
						}),
					};
				}),
			}];

			if (userToSendEmail) {
				const email = userToSendEmail.email;
				const name = [userToSendEmail.surname ?? '', userToSendEmail.name ?? '', userToSendEmail.patronymic ?? ''].join(' ');

				const child = {
					label: t('Errand'),
					value: 'Errand',
					isDefaultValue: true,
					children: [{
						label: name,
						value: email,
					}],
				};

				const mailSubjectTitle = [t('Errand'), 'От', formatDateAndTime(errand.ts ?? new Date())].join(' ');
				recipients[0].children.push(child);

				setMailsArray([{ value: email, tooltip: name }]);
				setDefaultEmails(email);
				setMailSubject(mailSubjectTitle);
				setMailBody(getErrandMailBody(errand));
			}
			setRecipients(recipients);
			assignObjectPaths(recipients);
		}
	}, [workingGroupsData, usersData, errandData, personData]);

	if ([errandState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
		return <MailForm recipients={[]} mailSubject={''} mailBody={''} defaultEmails={''} emailsArray={[]}/>;
	}

	return <MailForm recipients={recipients} mailSubject={mailSubject} mailBody={mailBody} defaultEmails={defaultEmails} emailsArray={mailsArray}/>;
}

import React, { useMemo, useState, useEffect } from 'react';
import '../../public/stylesheets/mail-sender.css';
import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { Button, Field, Label, Icon } from '@rocket.chat/fuselage';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useUser } from '../../../../client/contexts/UserContext';
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

	const debouncedParams = useDebouncedValue(params, 50);
	const debouncedSort = useDebouncedValue(sort, 50);
	const query = useQuery(debouncedParams, debouncedSort);
	const workingGroupsQuery = useWorkingGroupsQuery(debouncedParams, debouncedSort);

	const data = useEndpointData('users.all', query) || {};

	const workingGroupsData = useEndpointData('working-groups.list', workingGroupsQuery) || {};

	const goBack = () => {
		window.history.back();
	};

	return <Page>
		<Page.Header>
			<Field width={'100%'} display={'block'} marginBlock={'15px'}>
				<Button className='go-back-button' onClick={goBack}>
					<Icon name='back'/>
				</Button>
				<Label fontScale='h1'>{t('Send_email')}</Label>
			</Field>
		</Page.Header>
		<Page.Content>
			{context === undefined && <MailSender workingGroupsData={workingGroupsData} usersData={data.users}/>}
			{context === 'council' && <MailSenderWithCouncil workingGroupsData={workingGroupsData} usersData={data.users} debouncedParams={debouncedParams} debouncedSort={debouncedSort} id={id}/>}
			{context === 'errand' && <MailSenderWithErrand workingGroupsData={workingGroupsData} usersData={data.users} debouncedParams={debouncedParams} debouncedSort={debouncedSort} id={id}/>}
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
			children: workingGroups.map((workingGroup) => {
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
	const councilData = useEndpointData('councils.findOne', councilQuery) || {};

	const [recipients, setRecipients] = useState([]);
	const [defaultEmails, setDefaultEmails] = useState('');
	const [mailSubject, setMailSubject] = useState('');
	const [mailBody, setMailBody] = useState('');
	const label = t('Council_participants');

	useEffect(() => {
		const users = usersData || [];
		const invitedUsers = councilData ? councilData.invitedUsers : [];
		const workingGroups = workingGroupsData.workingGroups || [];
		if (councilData) {
			let emails = '';
			const recipients = [{
				label: 'Все пользователи',
				value: 'all_users',
				children: workingGroups.map((workingGroup) => {
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

			const child = {
				label,
				value: 'Council',
				isDefaultValue: true,
				children: !invitedUsers ? [] : invitedUsers.map((invitedUser) => {
					const indexUser = users.findIndex((user) => user._id === invitedUser);
					if (indexUser < 0) {
						return;
					}
					const value = users[indexUser];
					emails += (value.emails ? value.emails[0].address : '') + ',';
					return {
						label: [value.surname, value.name, value.patronymic].join(' '),
						value: value.emails ? value.emails[0].address : '',
					};
				}),
			};

			recipients[0].children.push(child);
			const mailSubject = ['Council', 'От', formatDateAndTime(councilData.d)].join(' ');

			setDefaultEmails(emails);
			setMailSubject(mailSubject);
			setMailBody(councilData.desc);
			setRecipients(recipients);
			assignObjectPaths(recipients);
		}
	}, [workingGroupsData, usersData]);

	return <MailForm recipients={recipients} mailSubject={mailSubject} mailBody={mailBody} defaultEmails={defaultEmails}/>;
}

function MailSenderWithErrand({ workingGroupsData, usersData, debouncedParams, debouncedSort, id }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const currentUser = useUser();
	const errandQuery = useErrandQuery(debouncedParams, debouncedSort, id);
	const errandData = useEndpointData('errands.findOne', errandQuery) || {};

	const [recipients, setRecipients] = useState([]);
	const [defaultEmails, setDefaultEmails] = useState('');
	const [mailSubject, setMailSubject] = useState('');
	const [mailBody, setMailBody] = useState('');

	const getErrandMailBody = (errand) => {
		let mailBody = '';

		if (errand) {
			mailBody += errand.desc + '<br><br>';
			mailBody += t('Errand_Expired_date') + ': ' + formatDateAndTime(errand.expireAt);
		}

		return mailBody;
	};

	useEffect(() => {
		const users = usersData || [];
		const errand = errandData || {};
		const workingGroups = workingGroupsData.workingGroups || [];
		if (errandData) {
			const userToSendEmail = users.find((user) =>
				(currentUser._id === errand.initiatedBy._id && user._id === errand.chargedToUser._id)
				|| (currentUser._id === errand.chargedToUser._id && user._id === errand.initiatedBy._id)) || {};
			const email = userToSendEmail.emails ? userToSendEmail.emails[0].address : '';

			const recipients = [{
				label: 'Все пользователи',
				value: 'all_users',
				children: workingGroups.map((workingGroup) => {
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

			const child = {
				label: t('Errand'),
				value: 'Errand',
				isDefaultValue: true,
				children: [{
					label: [userToSendEmail.surname, userToSendEmail.name, userToSendEmail.patronymic].join(' '),
					value: userToSendEmail.emails ? userToSendEmail.emails[0].address : '',
				}],
			};
			recipients[0].children.push(child);
			setDefaultEmails(email);
			const mailSubjectTitle = [t('Errand'), 'От', formatDateAndTime(errand.ts)].join(' ');
			setMailSubject(mailSubjectTitle);
			setMailBody(getErrandMailBody(errand));
			setRecipients(recipients);
			assignObjectPaths(recipients);
		}
	}, [workingGroupsData, usersData]);

	return <MailForm recipients={recipients} mailSubject={mailSubject} mailBody={mailBody} defaultEmails={defaultEmails}/>;
}

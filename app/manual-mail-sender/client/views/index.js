import React, { useMemo, useState, useEffect } from 'react';
import '../../public/stylesheets/mail-sender.css';
import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { Button, Field, Label, Icon } from '@rocket.chat/fuselage';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
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
}), [JSON.stringify(params), JSON.stringify(sort)]);

const useWorkingGroupsQuery = (params, sort) => useMemo(() => ({
	sort: JSON.stringify({ [sort[0]]: sortDir(sort[1]), titles: sort[0] === 'title' ? sortDir(sort[1]) : undefined }),
}), [JSON.stringify(params), JSON.stringify(sort)]);

const useCouncilQuery = (params, sort, _id) => useMemo(() => ({
	query: JSON.stringify({ _id }),
	fields: JSON.stringify({ invitedUsers: 1 }),
	sort: JSON.stringify({ [sort[0]]: sortDir(sort[1]), id: sort[0] === '_id' ? sortDir(sort[1]) : undefined }),
}), [JSON.stringify(params), JSON.stringify(sort), JSON.stringify(_id)]);

const getRequestToContext = (context) => {
	let request = '';
	if (context === 'council') {
		request = 'councils.findOne';
	}
	if (context === 'errand') {
		request = 'nds';
	}
	return request;
};

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

function GetContextData(request, query) {
	const dataFromContext = useEndpointData(request, query) || {};
	return dataFromContext;
}

export function MailSenderPage() {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const [params, setParams] = useState({ text: '' });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const workingGroupsQuery = useWorkingGroupsQuery(debouncedParams, debouncedSort);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const councilQuery = useCouncilQuery(debouncedParams, debouncedSort, id);

	const data = useEndpointData('users.all', query) || {};

	const workingGroupsData = useEndpointData('working-groups.list', workingGroupsQuery) || {};

	//const dataFromContext = useEndpointData('councils.findOne', councilQuery) || {};

	// eslint-disable-next-line new-cap
	const dataFromContext = GetContextData(getRequestToContext(context), councilQuery) ?? {};

	const [recipients, setRecipients] = useState([]);
	const [defaultEmails, setDefaultEmails] = useState('');
	const [mailSubject, setMailSubject] = useState('');
	const [mailBody, setMailBody] = useState('');
	const label = t('Council_participants');

	useEffect(() => {
		const workingGroups = workingGroupsData.workingGroups || [];
		const users = data.users || [];
		const invitedUsers = dataFromContext ? dataFromContext.invitedUsers : [];
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

		if (context === 'council' && dataFromContext) {
			let emails = '';
			const child = {
				//label: [label, ' (', invitedUsers ? invitedUsers.length : 0, ')'].join(''),
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
			//console.log(dataFromContext);
			setDefaultEmails(emails);
			const mailSubject = [t('Council'), 'От', formatDateAndTime(dataFromContext.d)].join(' ');
			setMailSubject(mailSubject);
			setMailBody(dataFromContext.desc);
		}

		assignObjectPaths(recipients);

		setRecipients(recipients);
	}, [workingGroupsData, data, dataFromContext]);

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
			<MailForm recipients={recipients} mailSubject={mailSubject} mailBody={mailBody} defaultEmails={defaultEmails}/>
		</Page.Content>
	</Page>;
}

MailSenderPage.displayName = 'MailSenderPage';

export default MailSenderPage;

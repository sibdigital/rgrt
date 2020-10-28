import React, { useMemo, useState, useEffect } from 'react';
import '../../public/stylesheets/mail-sender.css';
import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import MailForm from './MailForm';
import { Button, Field, Label, Icon } from '@rocket.chat/fuselage';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = (params, sort) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, username: 1, emails: 1 }),
	query: JSON.stringify({
		$or: [
			{ 'emails.address': { $regex: params.text || '', $options: 'i' } },
			{ username: { $regex: params.text || '', $options: 'i' } },
			{ name: { $regex: params.text || '', $options: 'i' } },
		],
	}),
	sort: JSON.stringify({ [sort[0]]: sortDir(sort[1]), usernames: sort[0] === 'name' ? sortDir(sort[1]) : undefined }),
}), [JSON.stringify(params), JSON.stringify(sort)]);

const assignObjectPaths = (obj, stack) => {
	const isArray = Array.isArray(obj);
	Object.keys(obj).forEach(k => {
		const node = obj[k];
		const key = isArray ? `[${k}]` : k;
		if (typeof node === 'object') {
			node.path = stack ? `${stack}.${key}` : key;
			assignObjectPaths(node, node.path);
		}
	})
}

export function MailSenderPage() {
	const t = useTranslation();

	const [params, setParams] = useState({ text: '' });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);

	let data = useEndpointData('users.all', query) || {};

	const [recipients, setRecipients] = useState([]);

	useEffect(() => {
		const users = data.users || [];
		const recipients = [{
			label: 'Все пользователи',
			value: 'all_users',
			children: users.map((value) => {
				return {
					label: value.name,
					value: value.emails ? value.emails[0].address : '',
				}
			})
		}]

		assignObjectPaths(recipients);

		setRecipients(recipients);
	}, [data]);

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
			<MailForm recipients={recipients}/>
		</Page.Content>
	</Page>;
}

MailSenderPage.displayName = 'MailSenderPage';

export default MailSenderPage;

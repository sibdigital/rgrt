import React, { useMemo, useState } from 'react';
import { Box, Button, Field, Label, Table } from '@rocket.chat/fuselage';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter} from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { GenericTable, Th } from '../../../ui/client/components/GenericTable';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { settings } from '../../../../app/settings/client';

export function CouncilPage() {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const councilId = useRouteParameter('id');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: councilId }),
	}), [councilId]);

	const data = useEndpointData('councils.findOne', query) || { result: [] };

	const invitedUsers = data.invitedUsers || { };

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const downloadCouncilParticipantsMethod = useMethod('downloadCouncilParticipants');

	const downloadCouncilParticipants = (_id) => async (e) => {
		e.preventDefault();
		try {
			const res = await downloadCouncilParticipantsMethod({ _id });
			const url = window.URL.createObjectURL(new Blob([res]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', 'file.docx');
			document.body.appendChild(link);
			link.click();
		} catch (e) {
			console.error('[index.js].downloadCouncilParticipants :', e);
		}
	};

	const address = settings.get('Site_Url') + 'invite/council/' + councilId;

	const header = useMemo(() => [
		<Th key={'fio'}>{t('Council_participant')}</Th>,
		<Th key={'position'}>{t('Council_Organization_Position')}</Th>,
		mediaQuery && <Th key={'contact'}>{t('Council_Contact_person')}</Th>,
		mediaQuery && <Th key={'phone'}>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'email'}>{t('Email')}</Th>,
		mediaQuery && <Th key={'createdAt'} style={{ width: '190px' }}>{t('Joined_at')}</Th>
	], [mediaQuery]);

	const renderRow = (invitedUser) => {
		const iu = invitedUser;
		return <Table.Row key={iu._id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' color='hint'>{iu.lastName} {iu.firstName} {iu.patronymic}</Table.Cell>
			<Table.Cell fontScale='p1' color='hint'>{iu.position}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' color='hint'>{iu.contactPersonLastName} {iu.contactPersonFirstName} {iu.contactPersonPatronymicName}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='hint'>{iu.phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='hint'>{iu.email}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='hint'>{formatDateAndTime(iu.ts)}</Table.Cell>}
		</Table.Row>;
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Council')}>
				<Button small onClick={downloadCouncilParticipants(councilId)} aria-label={t('Download')}>
					{t('Download_Council_Participant_List')}
				</Button>
			</Page.Header>
			<Page.Content>
				<Field mbe='x16'>
					<Field.Label>{t('Date')}</Field.Label>
					<Field.Row>
						<Box is='span' fontScale='p1'>{formatDateAndTime(data.d)}</Box>
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<Box is='span' fontScale='p1'>{data.desc}</Box>
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>Ссылка для регистрации в совещании</Field.Label>
					<Field.Row>
						<Box is='span' fontScale='p1'>{address}</Box>
					</Field.Row>
				</Field>
				<Label>{t('Council_Invited_Users')}</Label>
				<GenericTable header={header} renderRow={renderRow} results={invitedUsers} total={invitedUsers.length} setParams={setParams} params={params} />
			</Page.Content>
		</Page>
	</Page>;
}

CouncilPage.displayName = 'CouncilPage';

export default CouncilPage;

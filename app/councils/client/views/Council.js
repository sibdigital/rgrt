import React, { useMemo, useState } from 'react';
import { Box, Button, Field, Label, Table } from '@rocket.chat/fuselage';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter} from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { settings } from '../../../../app/settings/client';
import moment from 'moment';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

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
			const fileName = t('Council_Invited_Users_List') + ' ' + moment(new Date()).format('DD MMMM YYYY') + '.docx';
			link.setAttribute('download', fileName);
			document.body.appendChild(link);
			link.click();
		} catch (e) {
			console.error('[index.js].downloadCouncilParticipants :', e);
		}
	};

	const address = settings.get('Site_Url') + 'invite/council/' + councilId;

	const header = useMemo(() => [
		<Th key={'fio'} color='default'>{t('Council_participant')}</Th>,
		<Th key={'position'} color='default'>{t('Council_Organization_Position')}</Th>,
		mediaQuery && <Th key={'contact'} color='default'>{t('Council_Contact_person')}</Th>,
		mediaQuery && <Th key={'phone'} color='default'>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'email'} color='default'>{t('Email')}</Th>,
		mediaQuery && <Th key={'createdAt'} style={{ width: '190px' }} color='default'>{t('Joined_at')}</Th>
	], [mediaQuery]);

	const renderRow = (invitedUser) => {
		const iu = invitedUser;
		return <Table.Row key={iu._id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' style={style} color='default'>{iu.lastName} {iu.firstName} {iu.patronymic}</Table.Cell>
			<Table.Cell fontScale='p1' style={style} color='default'>{iu.position}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.contactPersonLastName} {iu.contactPersonFirstName} {iu.contactPersonPatronymicName}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.email}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{formatDateAndTime(iu.ts)}</Table.Cell>}
		</Table.Row>;
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Council')}>
			</Page.Header>
			<Page.Content>
				<Field mbe='x8'>
					<Field.Label>{t('Date')}</Field.Label>
					<Field.Row>
						<Box is='span' fontScale='p1'>{formatDateAndTime(data.d)}</Box>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<Box is='span' fontScale='p1'>{data.desc}</Box>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Council_invite_link')}</Field.Label>
					<Field.Row>
						<a href={address} is='span' fontScale='p1' target='_blank'>{address}</a>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Row>
						<Field.Label>{t('Council_Invited_Users')}</Field.Label>
						<Button small onClick={downloadCouncilParticipants(councilId)} aria-label={t('Download')}>
							{t('Download_Council_Participant_List')}
						</Button>
					</Field.Row>
					<GenericTable header={header} renderRow={renderRow} results={invitedUsers} total={invitedUsers.length} setParams={setParams} params={params} />
				</Field>
			</Page.Content>
		</Page>
	</Page>;
}

CouncilPage.displayName = 'CouncilPage';

export default CouncilPage;
